from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ReviewType(str, Enum):
    GENERAL = "general"
    ORDER = "order_review"
    ITEM = "item_review"

class ReviewBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000, description="Review content")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    content: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)


class ReviewDisplay(ReviewBase):
    id: int
    user_id: int
    type: ReviewType

    
    class Config:
        from_attributes = True

class GeneralReviewDisplay(ReviewDisplay):
    pass

class OrderReviewDisplay(ReviewDisplay):
    order_id: int

class ItemReviewDisplay(ReviewDisplay):
    item_id: int

