from pydantic import BaseModel,Field,EmailStr
from typing import Annotated,List



class ItemBase(BaseModel):
    name : str 
    description : str | None = None
    price : float


class ItemCreate(ItemBase):
    category_id : int


class ItemDisplay(ItemBase):
    id : int 
    category_name : str
    category_id : int

    class Config:
        orm_model = True

    
class ItemUpdate(ItemBase):
    name : str | None
    description : str | None 
    price : float | None
    category_id : int | None


class Item(ItemBase):
    id : int
    category_id : int

    class Config:
        orm_model = True





#------------------------category--------------------------------
class CategoryBase(BaseModel):
    name : str



class CategoryCreate(CategoryBase):
    pass 


class CategoryDisplay(CategoryBase):
    id : int
    items : List[Item] = []

class Category(CategoryBase):
    id : int
    items : List[Item] = []

    class Config:
        orm_model = True

class CategoryUpdate(CategoryBase):
    name : str | None = None
