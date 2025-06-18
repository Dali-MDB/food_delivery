from fastapi import APIRouter, Depends
from app.schemas.reviews_schemas import ReviewCreate, GeneralReviewDisplay,ReviewUpdate, OrderReviewDisplay, ItemReviewDisplay, ReviewDisplay
from typing import Annotated,List
from app.authentication import oauth2_scheme
from app.dependencies import sessionDep
from app.authentication import current_user
from app.models.reviews import Review, review_type, OrderReview, ItemReview
from app.models.orders import Order, order_status
from fastapi import HTTPException
from app.models.items import Item


reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])



#add a general review
@reviews_router.post("/add_general_review/",response_model=GeneralReviewDisplay)
def add_general_review(review: ReviewCreate,token: Annotated[str, Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    review_db = Review(
        user_id=user.id,  #associate the visited user id
        content=review.content,
        rating=review.rating,
        type=review_type.GENERAL
        )
    db.add(review_db)
    db.commit()
    db.refresh(review_db)
    return review_db

#add a order review
@reviews_router.post("/add_order_review/{order_id}/",response_model=OrderReviewDisplay)
def add_order_review(order_id:int,review: ReviewCreate,token: Annotated[str, Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    order_db = db.query(Order).filter(Order.id == order_id).first()
    if not order_db:
        raise HTTPException(status_code=404, detail="Order not found")
    if order_db.user_id != user.id:
        raise HTTPException(status_code=403, detail="You are not allowed to add a review to this order")
    if order_db.status != order_status.DELIVERED:
        raise HTTPException(status_code=403, detail="You can only add a review to a delivered order")
    
    #create the review
    review_db = OrderReview(
        user_id=user.id,
        content=review.content,
        rating=review.rating,
        type=review_type.ORDER,
        order_id=order_id)
    #add the review to the database
    db.add(review_db)
    db.commit()
    db.refresh(review_db)
    return review_db

#add a item review
@reviews_router.post("/add_item_review/{item_id}/",response_model=ItemReviewDisplay)
def add_item_review(item_id:int,review: ReviewCreate,token: Annotated[str, Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    item_db = db.query(Item).filter(Item.id == item_id).first()
    if not item_db:
        raise HTTPException(status_code=404, detail="Item not found")
   
    #create the review
    review_db = ItemReview(
        user_id=user.id,
        content=review.content,
        rating=review.rating,
        type=review_type.ITEM,
        item_id=item_id)
    db.add(review_db)
    db.commit()
    db.refresh(review_db)
    return review_db

#get all reviews
@reviews_router.get("/get_all_reviews/")
def get_all_reviews(db:sessionDep):
    reviews = db.query(Review).all()
    reviews_list = {
        review_type.GENERAL : [],
        review_type.ITEM : [],
        review_type.ORDER : []
    }
    print(reviews_list)
    for review in reviews:
        reviews_list[review.type].append(review)

    return reviews_list


@reviews_router.get('/get_review/{review_id}/')
def get_review(review_id: int, db: sessionDep):
    # This will automatically return the correct polymorphic type
    review = db.query(Review).filter(Review.id == review_id).first()

    
    if not review:
        raise HTTPException(404, 'this review is not found')
    
    # SQLAlchemy will return the actual subclass instance
    
    if isinstance(review, OrderReview):
        return OrderReviewDisplay.model_validate(review)
    elif isinstance(review, ItemReview):
        return ItemReviewDisplay.model_validate(review)
    else:  # General Review
        return GeneralReviewDisplay.model_validate(review)
    

    





#update the review no matter its type
@reviews_router.put("/update_review/{review_id}/")
def edit_review(review_id:int,review:ReviewUpdate,token: Annotated[str, Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    review_db = db.query(Review).filter(Review.id == review_id).first()
    if not review_db:
        raise HTTPException(status_code=404, detail="Review not found")
    if review_db.user_id != user.id:
        raise HTTPException(status_code=403, detail="You are not allowed to update this review")
    
    #update the review
    review_db.content = review.content if review.content else review_db.content
    review_db.rating = review.rating if review.rating else review_db.rating
    db.commit()
    db.refresh(review_db)
    return {
        "message": "Review updated successfully"
    }

#delete the review no matter its type
@reviews_router.delete("/delete_review/{review_id}/")
def delete_review(review_id:int,token: Annotated[str, Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    review_db = db.query(Review).filter(Review.id == review_id).first()
    if not review_db:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if review_db.user_id != user.id and not user.is_admin:    #the admin can delete any review for regulations
        raise HTTPException(status_code=403, detail="You are not allowed to delete this review")
    db.delete(review_db)
    db.commit()
    return { "message": "Review deleted successfully" }