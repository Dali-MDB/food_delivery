from fastapi import routing,Depends,HTTPException,status
from app.authentication import oauth2_scheme,current_user,pwd_context
from app.schemas.users_schemas import UserDisplay,UserUpdate
from app.schemas.orders_schemas import OrderDisplay
from app.models.orders import Order,order_status
from app.dependencies import sessionDep
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from app.models.users import User
from app.models.reviews import Review   
from typing import Annotated
from app.models.reviews import review_type
from app.management.admin_permission import verify_permission


profile_router = routing.APIRouter(
    prefix='/profile'
)


@profile_router.get('/me/view/',response_model=UserDisplay)
def view_my_profile(token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    return user


@profile_router.put('/me/modify/',response_model=UserDisplay)
def modify_profile(user: UserUpdate,token: Annotated[str,Depends(oauth2_scheme)],db: sessionDep):
    user_db = current_user(token,db)
    user_data = user.model_dump()
    for key,value in user_data.items():
        print(key,value)
        setattr(user_db,key,value)
    db.commit()
    db.refresh(user_db)
    return user_db
    



@profile_router.get('/all_users/',response_model=list[UserDisplay])
def get_all_users(token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not authorized to view this page")
    users = db.query(User).filter(User.is_admin == False).all()
    return users




@profile_router.get('/is_admin/')
def is_admin(token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    return user.is_admin
   
    

@profile_router.get('/me/my_orders/')
def view_my_items(token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    orders = db.query(Order).filter(Order.user_id == user.id,Order.status != order_status.PENDING).order_by(Order.ordered_at.desc()).all()
    #split them by status
    orders_by_status = {
        order_status.RECEIVED : [],
        order_status.PREPARING :[],
        order_status.DELIVERING : [], 
        order_status.DELIVERED : [],
        order_status.CANCELLED : []
    }
    for order in orders:
        orders_by_status[order.status].append(order)
    return orders_by_status


#an end point to view all the reviews of the user
@profile_router.get('/me/my_reviews/')
def view_my_reviews(token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    reviews = db.query(Review).filter(Review.user_id == user.id).all()
    #split them by type (general, item, order)
    reviews_by_type = {
        review_type.GENERAL : [],
        review_type.ITEM : [],
        review_type.ORDER : []
    }
    for review in reviews:
        reviews_by_type[review.type].append(review)
    return reviews_by_type

class PasswordChange(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

@profile_router.post('/me/change_password/')
def change_password(
    password_data: PasswordChange,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):   
    user = current_user(token, db)
    
    # Verify old password
    if not pwd_context.verify(password_data.old_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,   
            detail="Incorrect old password"
        )
    
    # Verify new password matches confirmation
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,  
            detail="New password and confirmation do not match"
        )
    
    # Hash and update the new password
    hashed_password = pwd_context.hash(password_data.new_password)
    user.password = hashed_password
    
    db.commit()
    db.refresh(user)
    
    return {"message": "Password changed successfully"}


@profile_router.get('/view_profile/{user_id}/',response_model=UserDisplay)
def view_profile(user_id:int,token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    #allow only admin or the user himself
    user = current_user(token,db)
    if user.id != user_id and not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not authorized to view this profile")
    user_db = db.query(User).filter(User.id == user_id).first()
    if user_db is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
    return user_db



#fetch all admins
@profile_router.get('/all_admins/',response_model=list[UserDisplay])
def all_admins(token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)   
    verify_permission(user)
    admins = db.query(User).filter(User.is_admin == True).all()
    return admins





from sqlalchemy import or_
#search for a specific user
@profile_router.get('/search_user/',response_model=list[UserDisplay])
def search_user(query:str,token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    verify_permission(user)
    #search using the query in email, name, phone
    users = db.query(User).filter(
        User.is_admin == False,
        or_(
            User.email.ilike(f"%{query}%"),
            User.username.ilike(f"%{query}%"),
            User.phone.ilike(f"%{query}%")
        )
    ).all()
    print(users[0])
    return users



#view a user profile (admin and same user restricted access)
@profile_router.get('/user/{user_id}/',response_model=UserDisplay)
def view_user_profile(user_id:int,token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    user = current_user(token,db)
    if user.id != user_id and not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="You are not authorized to view this profile")
    user_db = db.query(User).filter(User.id == user_id).first()
    if user_db is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="User not found")
    return user_db