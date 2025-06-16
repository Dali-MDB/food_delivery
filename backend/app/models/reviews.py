
'''
from app.database import Base
from sqlalchemy import Text, ForeignKey, Column, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr


class Review(Base):
    __tablename__ = 'reviews'

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50))  # discriminator column

    user_id = Column(Integer, ForeignKey('users.id'), index=True,nullable=True)
    content = Column(Text)
    rating = Column(Integer, default=4)

    user = relationship('User', back_populates='reviews')

    __mapper_args__ = {
        'polymorphic_identity': 'review',
        'polymorphic_on': type
    }

    def __repr__(self):
        return f'General report : {self.id} by {self.user}'



class OrderReview(Review):
    __tablename__ = 'orderreviews'

    id = Column(Integer, ForeignKey('reviews.id'), primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), index=True)

    order = relationship('Order', back_populates='reviews')

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

        
'''