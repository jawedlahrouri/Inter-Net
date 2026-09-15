from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base


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
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    credentials = Column(JSON, nullable=True)
    is_connected = Column(Boolean, default=True)
    connected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="services")
    service = relationship("Service", back_populates="user_subscriptions")
