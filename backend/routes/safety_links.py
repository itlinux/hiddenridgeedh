"""
Safety Links — admin-managed useful links shown on the Safety & Alerts page.
"""

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from database import get_db
from middleware.auth import require_content_admin, require_super_admin
from models.schemas import SafetyLinkCreate, SafetyLinkUpdate

router = APIRouter(prefix="/api/safety-links", tags=["safety-links"])

# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


# ── Default seed data ────────────────────────────────────────────────────────

DEFAULT_LINKS = [
    {"label": "El Dorado County Sheriff", "url": "https://www.edcgov.us/Government/Sheriff", "sort_order": 0},
    {"label": "El Dorado Hills Fire", "url": "https://www.edhfire.com", "sort_order": 1},
    {"label": "Ready for Wildfire", "url": "https://www.readyforwildfire.org", "sort_order": 2},
    {"label": "PG&E Outage Map", "url": "https://pgealerts.alerts.pge.com/outagecenter/", "sort_order": 3},
    {"label": "Rattlesnake Safety (CDFW)", "url": "https://wildlife.ca.gov/Keep-Me-Wild/Rattlesnakes", "sort_order": 4},
    {"label": "Nextdoor (EDH)", "url": "https://nextdoor.com", "sort_order": 5},
    {"label": "El Dorado Hills CSD", "url": "https://www.edhcsd.org", "sort_order": 6},
    {"label": "CAL FIRE Incidents", "url": "https://www.fire.ca.gov/incidents", "sort_order": 7},
    {"label": "AirNow — Air Quality", "url": "https://www.airnow.gov/?city=El%20Dorado%20Hills&state=CA", "sort_order": 8},
    {"label": "El Dorado County Alerts (Nixle)", "url": "https://www.nixle.com", "sort_order": 9},
    {"label": "SMUD Outage Map", "url": "https://www.smud.org/en/Customer-Support/Outage-Status", "sort_order": 10},
    {"label": "EID Water District", "url": "https://www.eid.org", "sort_order": 11},
    {"label": "National Weather Service — Sacramento", "url": "https://www.weather.gov/sto/", "sort_order": 12},
    {"label": "Ring Neighbors (Crime Alerts)", "url": "https://neighbors.ring.com", "sort_order": 13},
]


# ── Public ───────────────────────────────────────────────────────────────────

@router.get("")
async def list_safety_links():
    """Return all safety links sorted by sort_order (public)."""
    db = get_db()
    cursor = db.safety_links.find().sort("sort_order", 1)
    links = [_serialize(doc) async for doc in cursor]
    return {"links": links, "total": len(links)}


# ── Admin CRUD ───────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def create_safety_link(
    data: SafetyLinkCreate,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    doc = {
        **data.model_dump(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await db.safety_links.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.put("/{link_id}")
async def update_safety_link(
    link_id: str,
    data: SafetyLinkUpdate,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    existing = await db.safety_links.find_one({"_id": ObjectId(link_id)})
    if not existing:
        raise HTTPException(404, "Link not found")

    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No fields to update")

    updates["updated_at"] = datetime.utcnow()
    await db.safety_links.update_one({"_id": ObjectId(link_id)}, {"$set": updates})
    updated = await db.safety_links.find_one({"_id": ObjectId(link_id)})
    return _serialize(updated)


@router.delete("/{link_id}", status_code=204)
async def delete_safety_link(
    link_id: str,
    current_user: dict = Depends(require_content_admin),
):
    db = get_db()
    result = await db.safety_links.delete_one({"_id": ObjectId(link_id)})
    if result.deleted_count == 0:
        raise HTTPException(404, "Link not found")


# ── Seed ─────────────────────────────────────────────────────────────────────

@router.post("/seed")
async def seed_default_links(
    current_user: dict = Depends(require_super_admin),
):
    """Insert default links if collection is empty. Safe to call multiple times."""
    db = get_db()
    count = await db.safety_links.count_documents({})
    if count > 0:
        return {"message": f"Collection already has {count} links. Seed skipped.", "seeded": 0}

    now = datetime.utcnow()
    docs = [{**link, "created_at": now, "updated_at": now} for link in DEFAULT_LINKS]
    await db.safety_links.insert_many(docs)
    return {"message": f"Seeded {len(docs)} default links.", "seeded": len(docs)}
