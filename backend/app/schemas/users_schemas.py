from pydantic import BaseModel,Field,EmailStr
from typing import Annotated,List
#from app.models.reviews import Review
from .orders_schemas import Order

class UserBase(BaseModel):
    username : str = Field(max_length=30)
    phone : str = Field(max_length=15)
    email : EmailStr = Field(max_length=50)
    


class UserCreate(UserBase):
    password : str 


class UserDisplay(UserBase):
    id : int 
    is_admin : bool = Field(default=False)

    class config:
        orm_mode = True
    

class User(UserBase):
    id : int
    password : str
    orders : List[Order]
    is_admin : bool = Field(default=False)

    class config:
        orm_mode = True


class UserUpdate(UserBase):
    username : str | None = None 
    phone : str | None = None
    email : EmailStr | None = None
