from app.database import Base
from sqlalchemy import Column,ForeignKey,Integer,Numeric,String,Text,DateTime,Enum
from sqlalchemy.orm import relationship
from .items import Item
#from .reviews import OrderReview


class ItemOrder(Base):
    __tablename__ = 'itemorders'

    id = Column(Integer,index=True,primary_key=True)
    quantity = Column(Integer,default=1)
    total_price = Column(Numeric(10,2))
    
    order_id = Column(Integer,ForeignKey('orders.id'),nullable=True)
    item_id = Column(Integer,ForeignKey('items.id'))

    order = relationship('Order',back_populates='item_orders')
    item = relationship(Item,back_populates='item_orders')

    def __repr__(self):
        return f'order {self.id} of {self.item} linked to {self.order}'


from enum import Enum as PyEnum
class order_status (str, PyEnum):
    PENDING = "PENDING"
    RECEIVED = "RECEIVED"
    PREPARING = "PREPARING"
    DELIVERING = "DELIVERING"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer,index=True,primary_key=True)
    user_id = Column(Integer,ForeignKey('users.id'),index=True,nullable=True)
    address = Column(Text)
    ordered_at = Column(DateTime,nullable=True)
    session = Column(String(50),nullable=True)
    status = Column(Enum(order_status),default=order_status.PENDING)

    user = relationship('User',back_populates='orders')
    item_orders = relationship(ItemOrder,back_populates='order')
 #   review = relationship(OrderReview,back_populates='order')



    def __repr__(self):
        return f'order: {self.id} - '

      

