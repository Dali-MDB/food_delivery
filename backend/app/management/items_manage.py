from fastapi import Depends,Query,routing,UploadFile,File
from app.schemas.items_schemas import ItemCreate,ItemDisplay,ItemUpdate
from app.schemas.users_schemas import User
from fastapi.exceptions import HTTPException
from fastapi import status
from app.dependencies import sessionDep
from app.models.items import Item,Category
from app.authentication import oauth2_scheme,current_user
from typing import Annotated
from app.management.admin_permission import verify_permission
from app.dependencies import sessionDep
import os
from fastapi.responses import FileResponse

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





import uuid

#end poins to attach images to items
@items_router.post('/image_item/{item_id}/attach/',response_model=ItemDisplay)
async def attach_image(item_id:int,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)],image:UploadFile=File(...)):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    item_db = fetch_item(item_id,db)


    #validate the image
    if not image.filename.endswith(('.png','.jpg','.jpeg')):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail='invalid image format')
    
    #check for old image
    if item_db.image_url:
        os.remove(f'uploaded_files/items/{item_db.image_url}')

    

    #generate a unique name for the image + make sure it contains the extension
    item_db.image_url = f'{item_db.name}_{uuid.uuid4()}.{image.filename.split(".")[-1]}'
    #save the image to the uploaded_files directory
    with open(f'uploaded_files/items/{item_db.image_url}','wb') as f:
        f.write(await image.read())
    db.commit()
    db.refresh(item_db)
    return item_db

#end point to get the image of an item
@items_router.get('/image_item/{item_id}/get/')
async def get_image(item_id:int,db:sessionDep):
    item_db = fetch_item(item_id,db)
    return FileResponse(f'uploaded_files/items/{item_db.image_url}')


#end point to delete the image of an item
@items_router.delete('/image_item/{item_id}/delete/')
async def delete_image(item_id:int,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    item_db = fetch_item(item_id,db)
    if item_db.image_url:
        os.remove(f'uploaded_files/items/{item_db.image_url}')
        item_db.image_url = None
    db.commit()
    db.refresh(item_db)
    return item_db


 





  