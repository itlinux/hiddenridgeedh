"""
Tests for PUT /api/members/{id}: a super admin corrects another member's details.

Run from backend/:  python -m pytest tests
"""

import os
import sys

import pytest
from bson import ObjectId
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from middleware.auth import require_super_admin  # noqa: E402
from routes import members  # noqa: E402


class FakeUsers:
    def __init__(self, docs):
        self.docs = {d["_id"]: d for d in docs}

    async def find_one(self, query):
        return self.docs.get(query["_id"])

    async def update_one(self, query, update):
        self.docs[query["_id"]].update(update["$set"])


class FakeDB:
    def __init__(self, docs):
        self.users = FakeUsers(docs)


@pytest.fixture
def setup(monkeypatch):
    admin = {"_id": ObjectId(), "full_name": "Remo Mattei", "role": "super_admin"}
    wife = {
        "_id": ObjectId(), "full_name": "Vonnie Mattei", "role": "member",
        "email": "v@example.com", "address": "1 Old Street", "sms_opt_in": False,
        "is_approved": True, "is_active": True,
    }
    db = FakeDB([admin, wife])
    monkeypatch.setattr(members, "get_db", lambda: db)

    def build(as_super_admin=True):
        app = FastAPI()
        app.include_router(members.router)

        def dep():
            if not as_super_admin:
                raise HTTPException(403, "Super admin access required")
            return admin

        app.dependency_overrides[require_super_admin] = dep
        return TestClient(app)

    return build, admin, wife


def test_super_admin_fixes_address(setup):
    build, admin, wife = setup
    r = build().put(f"/api/members/{wife['_id']}", json={"address": "42 Grand Teton Dr"})
    assert r.status_code == 200
    assert r.json()["address"] == "42 Grand Teton Dr"
    assert wife["address"] == "42 Grand Teton Dr"
    assert wife["updated_by"] == str(admin["_id"])


def test_consent_role_and_email_cannot_be_changed(setup):
    build, _, wife = setup
    r = build().put(f"/api/members/{wife['_id']}", json={
        "address": "42 Grand Teton Dr", "sms_opt_in": True, "role": "super_admin", "email": "x@example.com",
    })
    assert r.status_code == 200
    assert wife["sms_opt_in"] is False
    assert wife["role"] == "member"
    assert wife["email"] == "v@example.com"


def test_not_super_admin_is_refused(setup):
    build, _, wife = setup
    r = build(as_super_admin=False).put(f"/api/members/{wife['_id']}", json={"address": "x"})
    assert r.status_code == 403
    assert wife["address"] == "1 Old Street"


def test_unknown_member_and_empty_body(setup):
    build, _, wife = setup
    client = build()
    assert client.put(f"/api/members/{ObjectId()}", json={"address": "x"}).status_code == 404
    assert client.put("/api/members/not-an-id", json={"address": "x"}).status_code == 404
    assert client.put(f"/api/members/{wife['_id']}", json={}).status_code == 400
