"""
Household dogs: up to MAX_DOGS per account, each optionally "in loving memory".

Stored on the user as `dogs: [{name, bio, photo_url, in_memory, memorial_years, memorial_url}]`.
Accounts from before the list existed have one dog in the old flat fields
(dog_name / dog_bio / dog_photo_url); household_dogs() reads those until the
first change to the list writes `dogs`.
"""

MAX_DOGS = 2


def household_dogs(user: dict) -> list:
    if "dogs" in user:
        return user.get("dogs") or []
    if user.get("dog_name") or user.get("dog_bio") or user.get("dog_photo_url") or user.get("has_dog"):
        return [{
            "name": user.get("dog_name") or "",
            "bio": user.get("dog_bio") or "",
            "photo_url": user.get("dog_photo_url"),
            "in_memory": False,
            "memorial_years": "",
            "memorial_url": "",
        }]
    return []


def has_living_dog(dogs: list) -> bool:
    return any(not d.get("in_memory") for d in dogs)
