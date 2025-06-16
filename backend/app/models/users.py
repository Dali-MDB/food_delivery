from app.database import Base
from sqlalchemy import Column,Integer,String,ForeignKey,Boolean,Text
from sqlalchemy.orm import relationship



class User(Base):
    __tablename__ = 'users'

    id = Column(Integer,primary_key=True,index=True)
    username = Column(String(30),index=True,unique=True)
    phone = Column(String(20),index=True,unique=True,nullable=True)
    email = Column(String(50),index=True,unique=True)
    password = Column(Text)
    is_admin = Column(Boolean,default=False)
    
    orders = relationship('Order',back_populates="user")
  #  reviews = relationship('Review',back_populates='user')

    def __repr__(self):
        p = f' - {self.phone}' if self.phone else ''
        return f'user: {self.email} - {self.is_admin}'+ p
    


