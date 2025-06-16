from pydantic import BaseModel,Field,EmailStr
from typing import Annotated,List
from .items_schemas import Item,ItemDisplay
from app.models.orders import order_status

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
    address : str
    ordered_at : str|None
    session : str
    status : order_status = order_status.PENDING



class OrderCreate(OrderBase):
    user_id : int
    item_orders : List[ItemOrder]|None = []


class OrderDisplay(OrderBase):
    id : int
    status : order_status
    calculate_total : float
    item_orders : List[ItemOrder]|None = []


class Order(OrderBase):
    id : int 
    status : order_status
    item_orders : List[ItemOrder]|None = []

    class Config:
        orm_model = True




