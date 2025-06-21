from pydantic import BaseModel,Field,EmailStr
from typing import Annotated,List
from .items_schemas import Item,ItemDisplay
from app.models.orders import order_status
from datetime import datetime



from enum import Enum as PyEnum
class order_status (str, PyEnum):
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"
    PREPARING = "PREPARING"
    DELIVERING = "DELIVERING"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class ItemOrderBase(BaseModel):
    quantity : int = 1

class ItemOrderCreate(ItemOrderBase):
    item_id : int

class ItemOrderDisplay(ItemOrderBase):
    id : int
    total_price : float
    item_name : str
    order_id : int


class ItemOrder(ItemOrderBase):
    id : int 
    order_id : int
    item_id : int
    total_price : float

    class Config:
        orm_model = True


class OrderBase(BaseModel):
    address : str | None
    ordered_at : datetime|None
    status : order_status = order_status.PENDING



class OrderCreate(OrderBase):
    user_id : int
    item_orders : List[ItemOrder]|None = []


class OrderDisplay(OrderBase):
    id : int
    status : order_status
    calculate_total : float
    item_orders : List[ItemOrderDisplay]|None = []
    total_price : float
    username: str = Field(..., description="User's username")
    email: str = Field(..., description="User's email")
    phone: str = Field(..., description="User's phone number")

    class Config:
        from_attributes = True  # Note: it's orm_mode, not orm_model


class Order(OrderBase):
    id : int 
    status : order_status
    item_orders : List[ItemOrder]|None = []

    class Config:
        orm_model = True




