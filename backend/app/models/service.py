from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.security import encrypt_token, decrypt_token


class EncryptedToken(TypeDecorator):
    """
    @brief SQLAlchemy TypeDecorator that transparently encrypts OAuth tokens upon write and decrypts them upon read.
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return encrypt_token(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return decrypt_token(value)
        return value


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    auth_type = Column(Enum("none", "api_key", "oauth2", name="service_auth_types"), default="none", nullable=False)
    icon = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    widgets = relationship("WidgetDefinition", back_populates="service", cascade="all, delete-orphan")
    user_subscriptions = relationship("UserService", back_populates="service", cascade="all, delete-orphan")


class UserService(Base):
    __tablename__ = "user_services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    access_token = Column(EncryptedToken, nullable=True)
    refresh_token = Column(EncryptedToken, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    credentials = Column(JSON, nullable=True)
    is_connected = Column(Boolean, default=True)
    connected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="services")
    service = relationship("Service", back_populates="user_subscriptions")
