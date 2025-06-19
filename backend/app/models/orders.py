from app.database import Base
from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from .items import Item
from .reviews import OrderReview
from enum import Enum as PyEnum


class ItemOrder(Base):
    __tablename__ = 'itemorders'

    id = Column(Integer, index=True, primary_key=True)
    quantity = Column(Integer, default=1)
    total_price = Column(Numeric(10, 2))
    
    # Remove nullable=True since we now require authentication
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    item_id = Column(Integer, ForeignKey('items.id'), nullable=False)

    order = relationship('Order', back_populates='item_orders')
    item = relationship(Item, back_populates='orders')

    @property
    def item_name(self):
        return self.item.name
    
    def calculate_total_price(self):
        self.total_price = self.quantity * self.item.price
        return self.total_price

    def __repr__(self):
        return f'ItemOrder {self.id} of {self.item.name} linked to Order {self.order.id}'


class order_status(str, PyEnum):
    PENDING = "PENDING"      # Cart status
    RECEIVED = "RECEIVED"    # Order placed
    PREPARING = "PREPARING"  # Being prepared
    DELIVERING = "DELIVERING" # Out for delivery
    DELIVERED = "DELIVERED"   # Completed
    CANCELLED = "CANCELLED"   # Cancelled


class Order(Base):
    __tablename__ = 'orders'

    id = Column(Integer, index=True, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True, nullable=True)
    address = Column(Text, nullable=True)  # Only required when order is confirmed
    ordered_at = Column(DateTime, nullable=True)  # Set when order is confirmed
    status = Column(Enum(order_status), default=order_status.PENDING)

    user = relationship('User', back_populates='orders')
    item_orders = relationship(ItemOrder, back_populates='order', cascade="all, delete-orphan")
    review = relationship(OrderReview, back_populates='order', uselist=False)

    @property
    def calculate_total(self):
        total = 0
        for item_order in self.item_orders:
            if item_order.total_price:
                total += item_order.total_price
        return total

    @property
    def is_cart(self):
        """Check if this order is still a cart (pending)"""
        return self.status == order_status.PENDING

    @property
    def item_count(self):
        """Get total number of items in the order"""
        return sum(item_order.quantity for item_order in self.item_orders)

    def update_status(self, new_status: order_status):
        """Update order status"""
        self.status = new_status

    def can_be_modified(self):
        """Check if order can still be modified (only pending orders)"""
        return self.status == order_status.PENDING

    def __repr__(self):
        return f'Order {self.id} - Status: {self.status.value} - User: {self.user_id}'