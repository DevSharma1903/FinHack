import hashlib

def canonicalize_text(text: str) -> str:
    # Ensures same text → same hash 
    return " ".join(text.strip().split())

def hash_advice(text: str) -> str:
    canonical = canonicalize_text(text)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
