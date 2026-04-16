# utils/mautic.py
# Push confirmed newsletter subscribers to the shared Mautic instance.
# Hidden Ridge contacts go to segment MAUTIC_SEGMENT_ID, owned by
# MAUTIC_CONTACT_OWNER_ID (Mautic user 3 = hiddenridge).

import time
import httpx
from database import get_settings

_token_cache = {"token": None, "expires_at": 0}


async def _get_token() -> str:
    """Get a cached Mautic OAuth2 token, refreshing if expired."""
    if _token_cache["token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["token"]

    settings = get_settings()
    base = settings.mautic_base_url
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{base}/oauth/v2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": settings.mautic_client_id,
                "client_secret": settings.mautic_client_secret,
            },
        )
        r.raise_for_status()
        data = r.json()

    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600) - 300
    return data["access_token"]


async def push_to_mautic(email: str, first_name: str = "", last_name: str = ""):
    """Create/update a Mautic contact and add to the hiddenridge segment."""
    settings = get_settings()
    base = settings.mautic_base_url
    segment_id = settings.mautic_segment_id
    owner_id = settings.mautic_contact_owner_id

    try:
        token = await _get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=15) as client:
            # Create or update contact
            r = await client.post(
                f"{base}/api/contacts/new",
                headers=headers,
                json={
                    "email": email,
                    "firstname": first_name,
                    "lastname": last_name,
                    "tags": ["hiddenridge", "newsletter"],
                    "owner": owner_id,
                },
            )
            r.raise_for_status()
            contact_id = r.json().get("contact", {}).get("id")

            if not contact_id:
                return

            # Add to hiddenridge segment
            await client.post(
                f"{base}/api/segments/{segment_id}/contact/{contact_id}/add",
                headers=headers,
            )

    except Exception as e:
        # Non-fatal — the local newsletter system still works even if
        # Mautic is down. Log and move on.
        import logging
        logging.getLogger("mautic").warning(f"Mautic push failed for {email}: {e}")


async def remove_from_mautic(email: str):
    """Remove a contact from the hiddenridge segment and set DNC in Mautic."""
    settings = get_settings()
    base = settings.mautic_base_url
    segment_id = settings.mautic_segment_id

    try:
        token = await _get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=15) as client:
            # Find contact by email
            r = await client.get(
                f"{base}/api/contacts",
                headers=headers,
                params={"search": f"email:{email}"},
            )
            r.raise_for_status()
            contacts = r.json().get("contacts", {})

            if not contacts:
                return

            # Get the first matching contact ID
            contact_id = list(contacts.keys())[0]

            # Remove from hiddenridge segment
            await client.post(
                f"{base}/api/segments/{segment_id}/contact/{contact_id}/remove",
                headers=headers,
            )

            # Set Do Not Contact so Mautic won't email them
            await client.post(
                f"{base}/api/contacts/{contact_id}/dnc/email/add",
                headers=headers,
                json={"reason": 3, "comments": "Unsubscribed via hiddenridgeedh.com"},
            )

    except Exception as e:
        import logging
        logging.getLogger("mautic").warning(f"Mautic unsubscribe failed for {email}: {e}")
