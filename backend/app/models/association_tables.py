from sqlalchemy import Table,Column,Integer,ForeignKey
from app.database import Base

order_items_join = Table(
    'orderitemsjoin',
    Base.metadata,
    Column('order_id',Integer,ForeignKey('itemorders.id'),primary_key=True),
    Column('item_id',Integer,ForeignKey('items.id'),primary_key=True)
)