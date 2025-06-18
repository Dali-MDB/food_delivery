from fastapi import routing,Depends,HTTPException,status
from app.authentication import oauth2_scheme,current_user,pwd_context
from app.schemas.users_schemas import UserDisplay,UserUpdate
from app.schemas.orders_schemas import OrderDisplay
from app.models.orders import Order,order_status
from app.dependencies import sessionDep
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from app.models.users import User

from typing import Annotated


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
        setattr(user_db,key,value)
    db.commit()
    db.refresh(user_db)
    return user_db
    
   
    

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