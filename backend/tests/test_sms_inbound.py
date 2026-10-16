"""
Tests for the Twilio inbound SMS webhook (POST /api/alerts/sms/inbound).

Run from backend/:  pip install -r requirements.txt pytest && python -m pytest tests
No MongoDB or Twilio needed: the database is a small in-memory fake.
"""

import os
import sys

import pytest
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routes import alerts  # noqa: E402


class FakeCursor:
    def __init__(self, docs):
        self._docs = iter(docs)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self._docs)
        except StopIteration:
            raise StopAsyncIteration


class FakeUsers:
    """Supports only the query sms_inbound sends: active + approved users."""

    def __init__(self, docs):
        self.docs = docs

    def find(self, query):
        return FakeCursor([
            d for d in self.docs
            if d.get("is_active") == query["is_active"] and d.get("is_approved") == query["is_approved"]
        ])


class FakeAlerts:
    def __init__(self):
        self.inserted = []

    async def insert_one(self, doc):
        self.inserted.append(doc)


class FakeDB:
    def __init__(self, users):
        self.users = FakeUsers(users)
        self.alerts = FakeAlerts()


class FakeSettings:
    twilio_auth_token = ""  # skip signature validation


def make_user(full_name, phone="", alt_phone="", alt_phone_name="", **extra):
    return {
        "_id": ObjectId(),
        "full_name": full_name,
        "username": full_name.split()[0].lower(),
        "phone": phone,
        "alt_phone": alt_phone,
        "alt_phone_name": alt_phone_name,
        "is_active": True,
        "is_approved": True,
        **extra,
    }


@pytest.fixture
def setup(monkeypatch):
    emails = []

    async def fake_send_emails(**kwargs):
        emails.append(kwargs)

    monkeypatch.setattr(alerts, "get_settings", lambda: FakeSettings())
    monkeypatch.setattr(alerts, "send_alert_emails_to_opted_in", fake_send_emails)

    app = FastAPI()
    app.include_router(alerts.router)
    client = TestClient(app)

    def run(users):
        db = FakeDB(users)
        monkeypatch.setattr(alerts, "get_db", lambda: db)
        return client, db

    return run


def text(client, sender, body="Coyote on Grand Teton Dr"):
    return client.post("/api/alerts/sms/inbound", data={"From": sender, "Body": body})


def test_main_phone_posts_alert_as_account_holder(setup):
    john = make_user("John Smith", phone="(916) 555-0101", alt_phone="916-555-0202", alt_phone_name="Maria")
    client, db = setup([john])

    r = text(client, "+19165550101")

    assert r.status_code == 200
    assert "Thanks John Smith!" in r.text
    assert len(db.alerts.inserted) == 1
    alert = db.alerts.inserted[0]
    assert alert["author_id"] == str(john["_id"])
    assert alert["author_name"] == "John Smith"
    assert alert["phone_from"] == "+19165550101"


def test_second_phone_posts_alert_with_household_name(setup):
    john = make_user("John Smith", phone="(916) 555-0101", alt_phone="916-555-0202", alt_phone_name="Maria")
    client, db = setup([john])

    r = text(client, "+19165550202")

    assert r.status_code == 200
    assert "Thanks Maria!" in r.text
    assert len(db.alerts.inserted) == 1
    alert = db.alerts.inserted[0]
    assert alert["author_id"] == str(john["_id"])
    assert alert["author_name"] == "Maria (Smith household)"


def test_second_phone_without_name_uses_account_holder(setup):
    john = make_user("John Smith", phone="9165550101", alt_phone="9165550202")
    client, db = setup([john])

    r = text(client, "+19165550202")

    assert "Thanks John Smith!" in r.text
    assert db.alerts.inserted[0]["author_name"] == "John Smith"


def test_unknown_number_is_rejected(setup):
    john = make_user("John Smith", phone="9165550101", alt_phone="9165550202")
    client, db = setup([john])

    r = text(client, "+19165559999")

    assert r.status_code == 200
    assert "not registered" in r.text
    assert db.alerts.inserted == []


def test_inactive_or_unapproved_accounts_do_not_match(setup):
    pending = make_user("Pat Pending", phone="9165550101", is_approved=False)
    disabled = make_user("Dee Disabled", alt_phone="9165550202", is_active=False)
    client, db = setup([pending, disabled])

    assert "not registered" in text(client, "+19165550101").text
    assert "not registered" in text(client, "+19165550202").text
    assert db.alerts.inserted == []


def test_number_on_two_accounts_is_not_posted(setup):
    # Wife has her own account with her phone AND husband listed it as his second phone
    john = make_user("John Smith", phone="9165550101", alt_phone="9165550202", alt_phone_name="Maria")
    maria = make_user("Maria Smith", phone="(916) 555-0202")
    client, db = setup([john, maria])

    r = text(client, "+19165550202")

    assert r.status_code == 200
    assert "more than one" in r.text
    assert db.alerts.inserted == []


def test_same_number_twice_on_one_account_counts_as_main_phone(setup):
    john = make_user("John Smith", phone="9165550101", alt_phone="+1 916 555 0101", alt_phone_name="Maria")
    client, db = setup([john])

    r = text(client, "+19165550101")

    assert "Thanks John Smith!" in r.text
    assert db.alerts.inserted[0]["author_name"] == "John Smith"


def test_reply_escapes_name_in_twiml(setup):
    john = make_user("John Smith", phone="9165550101", alt_phone="9165550202", alt_phone_name="Ann & <Bo>")
    client, db = setup([john])

    r = text(client, "+19165550202")

    assert "Thanks Ann &amp; &lt;Bo&gt;!" in r.text
