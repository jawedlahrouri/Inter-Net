from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import jwt
import bcrypt
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    @brief Checks a plain password against a bcrypt hash, treating any error as a mismatch.
    @param plain_password The clear-text password to verify.
    @param hashed_password The stored bcrypt hash to compare against.
    @return True if the password matches the hash, otherwise False.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """
    @brief Hashes a password with bcrypt using a freshly generated salt.
    @param password The clear-text password to hash.
    @return The bcrypt hash as a UTF-8 string.
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    @brief Creates a signed JWT containing the subject and an expiration time.
    @param subject The value stored in the token's sub claim, converted to a string.
    @param expires_delta Optional lifetime of the token, defaulting to the configured expiry in minutes.
    @return The encoded JWT string.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    @brief Decodes and validates a JWT using the configured secret key and algorithm.
    @param token The encoded JWT string to decode.
    @return The token payload dictionary, or None if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def _get_fernet() -> Any:
    """
    @brief Derives a deterministic 32-byte Fernet key from the project SECRET_KEY.
    @return A configured Fernet cipher instance.
    """
    import base64
    import hashlib
    from cryptography.fernet import Fernet

    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_token(plain_token: Optional[str]) -> Optional[str]:
    """
    @brief Encrypts an OAuth access or refresh token using Fernet before database storage.
    @param plain_token The plaintext token string to encrypt.
    @return The encrypted ciphertext token, or None if input was empty.
    """
    if not plain_token:
        return plain_token
    fernet = _get_fernet()
    return fernet.encrypt(plain_token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted_token: Optional[str]) -> Optional[str]:
    """
    @brief Decrypts an encrypted OAuth token from the database, falling back gracefully if already plaintext.
    @param encrypted_token The stored token string.
    @return The original plaintext token.
    """
    if not encrypted_token:
        return encrypted_token
    from cryptography.fernet import InvalidToken
    fernet = _get_fernet()
    try:
        return fernet.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
    except (InvalidToken, Exception):
        return encrypted_token

