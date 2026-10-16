"""
Tests for household dogs (up to 2, each optionally "in loving memory").

Run from backend/:  pip install -r requirements.txt pytest && python -m pytest tests
No MongoDB needed: the database is a small in-memory fake.
"""

import os
import sys

import pytest
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from middleware.auth import get_current_user, require_member  # noqa: E402
from routes import members  # noqa: E402
from utils.dogs import household_dogs  # noqa: E402

MAX_LEGACY = {
    "dog_name": "Max",
    "dog_bio": "He is super good with other dogs as well.",
    "dog_photo_url": "/uploads/dogs/max.jpeg",
    "has_dog": True,
    "dog_friendly": True,
}


class FakeUsers:
    def __init__(self, user):
        self.user = user

    async def update_one(self, query, update):
        assert query["_id"] == self.user["_id"]
        self.user.update(update["$set"])

    async def find_one(self, query):
        return self.user if query.get("_id") == self.user["_id"] else None


class FakeDB:
    def __init__(self, user):
        self.users = FakeUsers(user)


@pytest.fixture
def make_client(monkeypatch):
    deleted = []
    monkeypatch.setattr(members, "_delete_upload", lambda url: deleted.append(url) if url else None)

    async def fake_save_upload(file, subfolder=""):
        return f"/uploads/{subfolder}/new.jpg"

    monkeypatch.setattr(members, "_save_upload", fake_save_upload)

    def build(**fields):
        user = {"_id": ObjectId(), "full_name": "Remo Mattei", "is_approved": True, "is_active": True, **fields}
        db = FakeDB(user)
        monkeypatch.setattr(members, "get_db", lambda: db)
        app = FastAPI()
        app.include_router(members.router)
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[require_member] = lambda: user
        return TestClient(app), user, deleted

    return build


def test_legacy_single_dog_is_read_as_list():
    dogs = household_dogs({**MAX_LEGACY})
    assert dogs == [{
        "name": "Max",
        "bio": "He is super good with other dogs as well.",
        "photo_url": "/uploads/dogs/max.jpeg",
        "in_memory": False,
        "memorial_years": "",
        "memorial_url": "",
    }]
    assert household_dogs({}) == []
    assert household_dogs({**MAX_LEGACY, "dogs": []}) == []


def test_member_page_returns_dog_name_and_bio(make_client):
    client, user, _ = make_client(**MAX_LEGACY)
    r = client.get(f"/api/members/{user['_id']}")
    assert r.status_code == 200
    dog = r.json()["dogs"][0]
    assert dog["name"] == "Max"
    assert dog["bio"].startswith("He is super good")


def test_mark_legacy_dog_in_loving_memory_keeps_photo(make_client):
    client, user, deleted = make_client(**MAX_LEGACY)

    r = client.put("/api/members/me/dogs/0", json={
        "name": "Max",
        "bio": "He is super good with other dogs as well.",
        "in_memory": True,
        "memorial_years": "2014 – 2026",
        "memorial_url": "https://example.com/max",
    })

    assert r.status_code == 200
    max_dog = user["dogs"][0]
    assert max_dog["in_memory"] is True
    assert max_dog["photo_url"] == "/uploads/dogs/max.jpeg"
    assert max_dog["memorial_years"] == "2014 – 2026"
    assert max_dog["memorial_url"] == "https://example.com/max"
    # No living dog left: members-list icon and "friendly" switch off
    assert user["has_dog"] is False
    assert user["dog_friendly"] is False
    assert deleted == []


def test_add_second_dog_then_limit_of_two(make_client):
    client, user, _ = make_client(**MAX_LEGACY)
    client.put("/api/members/me/dogs/0", json={"name": "Max", "in_memory": True})

    r = client.post("/api/members/me/dogs", json={"name": "Luna", "bio": "New puppy"})
    assert r.status_code == 201
    assert [d["name"] for d in user["dogs"]] == ["Max", "Luna"]
    assert user["has_dog"] is True

    r = client.post("/api/members/me/dogs", json={"name": "Third"})
    assert r.status_code == 400
    assert len(user["dogs"]) == 2


def test_memorial_fields_dropped_when_not_in_memory(make_client):
    client, user, _ = make_client()
    r = client.post("/api/members/me/dogs", json={
        "name": "Luna", "in_memory": False, "memorial_years": "x", "memorial_url": "https://example.com",
    })
    assert r.status_code == 201
    assert user["dogs"][0]["memorial_years"] == ""
    assert user["dogs"][0]["memorial_url"] == ""


@pytest.mark.parametrize("url", ["javascript:alert(1)", "example.com/max", "ftp://example.com"])
def test_memorial_url_must_be_web_address(make_client, url):
    client, user, _ = make_client()
    r = client.post("/api/members/me/dogs", json={"name": "Max", "in_memory": True, "memorial_url": url})
    assert r.status_code == 422
    assert "dogs" not in user


def test_dog_photo_upload_and_delete(make_client):
    client, user, deleted = make_client(**MAX_LEGACY)

    r = client.post("/api/members/me/dogs/0/photo", files={"file": ("p.jpg", b"x", "image/jpeg")})
    assert r.status_code == 200
    assert user["dogs"][0]["photo_url"] == "/uploads/dogs/new.jpg"
    assert deleted == ["/uploads/dogs/max.jpeg"]

    r = client.delete("/api/members/me/dogs/0/photo")
    assert r.status_code == 200
    assert user["dogs"][0]["photo_url"] is None


def test_delete_dog_and_unknown_index(make_client):
    client, user, deleted = make_client(**MAX_LEGACY)

    assert client.put("/api/members/me/dogs/5", json={"name": "X"}).status_code == 404
    r = client.delete("/api/members/me/dogs/0")
    assert r.status_code == 200
    assert user["dogs"] == []
    assert user["has_dog"] is False
    assert deleted == ["/uploads/dogs/max.jpeg"]
