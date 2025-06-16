from pydantic import BaseModel,Field,EmailStr
from typing import Annotated,List
from .items_schemas import Item,ItemDisplay
from app.models.orders import order_status


class ItemOrderBase(BaseModel):
    quantity : int

class ItemOrderCreate(ItemOrderBase):
    order_id : int
    item_id : int

class ItemOrderDisplay(ItemOrderBase):
    id : int
    item : ItemDisplay
    order : 'OrderDisplay'


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
    item_orders : List[ItemOrder]|None = []


class Order(OrderBase):
    id : int 
    item_orders : List[ItemOrder]|None = []

    class Config:
        orm_model = True




