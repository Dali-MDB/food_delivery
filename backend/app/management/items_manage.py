from fastapi import Depends,Query,routing
from app.schemas.items_schemas import ItemCreate,ItemDisplay,ItemUpdate
from app.schemas.users_schemas import User
from fastapi.exceptions import HTTPException
from fastapi import status
from app.dependencies import sessionDep
from app.models.items import Item,Category
from app.authentication import oauth2_scheme,current_user
from typing import Annotated
from app.management.admin_permission import verify_permission


items_router = routing.APIRouter(
    prefix='/items'
)









@items_router.post('/add/',response_model=ItemDisplay)
def add_item(item:ItemCreate,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    item_data = item.model_dump()
    new_item = Item(**item_data)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@items_router.get('/all/',response_model=list[ItemDisplay])
def get_all_items(db:sessionDep):
    items = db.query(Item).all()
    return items

#a helper function to fet the item
def fetch_item(item_id:int,db:sessionDep):
    item = db.get(Item,item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail='item not found')
    return item

@items_router.get('/{item_id}/view/',response_model=ItemDisplay)
def view_item(item_id:int,db:sessionDep):
    item = fetch_item(item_id,db)
    return item

    


@items_router.put('/{item_id}/update/',response_model=ItemDisplay)
def update_item(item_id:int,item:ItemUpdate,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    item_db = fetch_item(item_id,db)
    item_data = item.model_dump()

    #since it is a partial update we only update the keys that has been sent
    for key,value in item_data.items():
        setattr(item_db,key,value)
    db.commit()
    db.refresh(item_db)
    return item_db


@items_router.delete('/{item_id}/delete/')
def delete_item(item_id:int,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    item_db = fetch_item(item_id,db)
    db.delete(item_db)
    db.commit()
    return {'message':'item deleted successfully'}






