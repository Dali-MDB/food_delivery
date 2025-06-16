from app.database import Base
from sqlalchemy import Column,Integer,Numeric,String,Text,ForeignKey
from sqlalchemy.orm import relationship
from .reviews import ItemReview



class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer,primary_key=True,index=True)
    name = Column(String(50),index=True,unique=True)

    items = relationship("Item",back_populates="category")

    def __repr__(self):
        return f'category : {self.name}'


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer,primary_key=True,index=True)
    name = Column(String(50),index=True,unique=True)
    description = Column(Text,nullable=True)
    price = Column(Numeric(10,2))
    category_id = Column(Integer,ForeignKey('categories.id'))


    category = relationship("Category",back_populates="items")
    orders = relationship("ItemOrder",back_populates="item")
    reviews = relationship(ItemReview,back_populates='item')

    @property
    def category_name(self):
        return self.category.name

    def __repr__(self):
        return f'item : {self.name} - {self.price}'



    

