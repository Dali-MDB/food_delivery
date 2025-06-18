from app.database import Base
from sqlalchemy import Text, ForeignKey, Column, Integer, String, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr
from enum import Enum as PyEnum

class review_type(str, PyEnum):
    GENERAL = "general"
    ORDER = "order_review"
    ITEM = "item_review"

class Review(Base):
    __tablename__ = 'reviews'

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(review_type), default=review_type.GENERAL)  # discriminator column

    user_id = Column(Integer, ForeignKey('users.id'), index=True,nullable=True)
    content = Column(Text)
    rating = Column(Integer, default=4)

    user = relationship('User', back_populates='reviews')

    __mapper_args__ = {
        'polymorphic_identity': 'general',  
        'polymorphic_on': type
    }

    def __repr__(self):
        return f'General report : {self.id} by {self.user}'



class OrderReview(Review):
    __tablename__ = 'orderreviews'

    id = Column(Integer, ForeignKey('reviews.id'), primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'),unique=True, nullable=True)

    order = relationship('Order', back_populates='review')

    __mapper_args__ = {
        'polymorphic_identity': 'order_review', 
    }

    def __repr__(self):
        return f'Order report : {self.id} on {self.order}'



class ItemReview(Review):
    __tablename__ = 'itemreviews'

    id = Column(Integer, ForeignKey('reviews.id'), primary_key=True)
    item_id = Column(Integer, ForeignKey('items.id'), index=True)

    item = relationship('Item', back_populates='reviews')

    __mapper_args__ = {
        'polymorphic_identity': 'item_review',
    }

    def __repr__(self):
        return f'Item report : {self.id} on {self.item}'

        
