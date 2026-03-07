"""
Simple profanity filter for forum content.
Replaces profane words with *** while preserving surrounding text.
"""

import re

# Common English profanity word list
_PROFANE_WORDS = {
    "ass", "asshole", "bastard", "bitch", "bullshit", "cock", "crap",
    "cunt", "damn", "dick", "douchebag", "fag", "faggot", "fuck",
    "fucked", "fucker", "fucking", "goddamn", "hell", "jackass",
    "motherfucker", "nigger", "nigga", "piss", "pissed", "pussy",
    "retard", "retarded", "shit", "shitty", "slut", "twat", "whore",
    "wanker", "stfu", "gtfo", "wtf", "lmfao", "dipshit", "dumbass",
    "asswipe", "butthole", "cocksucker", "horseshit", "shithead",
}

# Build a single regex pattern with word boundaries
_PATTERN = re.compile(
    r"\b(" + "|".join(re.escape(w) for w in sorted(_PROFANE_WORDS, key=len, reverse=True)) + r")\b",
    re.IGNORECASE,
)


def clean_text(text: str) -> str:
    """Replace profane words with ***."""
    return _PATTERN.sub("***", text)


def contains_profanity(text: str) -> bool:
    """Check if text contains profane words."""
    return bool(_PATTERN.search(text))
