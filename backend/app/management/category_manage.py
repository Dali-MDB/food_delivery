from app.schemas.items_schemas import CategoryCreate,CategoryDisplay,CategoryUpdate
from app.schemas.users_schemas import User
from fastapi.exceptions import HTTPException
from fastapi import status,Depends,routing
from app.models.items import Category,Item
from app.authentication import oauth2_scheme,current_user
from typing import Annotated
from app.management.admin_permission import verify_permission
from fastapi import Depends
from app.dependencies import sessionDep
from app.schemas.items_schemas import ItemDisplay
import os
from fastapi import UploadFile,File
from fastapi.responses import FileResponse



category_router = routing.APIRouter(
    prefix='/category'
)

#all categories end point
@category_router.get('/all/',response_model=list[CategoryDisplay])
def all_categories(db:sessionDep):
    categories = db.query(Category).all()
    return categories


@category_router.post('/add/',response_model=CategoryDisplay)
def add_category(category:CategoryCreate,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    category_data = category.model_dump()
    new_category = Category(**category_data)
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    return new_category

#a helper function to fetch a category
def fetch_category(category_id:int,db:sessionDep):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail='category not found')
    return category


@category_router.get('/{category_id}/view/',response_model=CategoryDisplay)
def view_category(category_id:int,db:sessionDep):
    category = fetch_category(category_id,db)
    return category


@category_router.put('/{category_id}/update/',response_model=CategoryDisplay)
def update_category(category_id:int,category:CategoryUpdate,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    category_db = fetch_category(category_id,db)    
    category_data = category.model_dump()   #extract the new data to be updated

    #since it is a partial update we only update the keys that has been sent
    for key,value in category_data.items():    
        setattr(category_db,key,value)
    db.commit()
    db.refresh(category_db)
    return category_db


@category_router.delete('/{category_id}/delete/')
def delete_category(category_id:int,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    category  = fetch_category(category_id,db)
    #we delete all items from this category
    db.query(Item).filter(Item.category_id == category.id).delete()
    db.delete(category)
    db.commit()
    return {'message':'category deleted successfully'}



@category_router.get('/{category_id}/all_items/',response_model=list[ItemDisplay])
def get_items_of_category(category_id:int,db:sessionDep):
    category = fetch_category(category_id,db)
    print("heerr")
    items = db.query(Item).filter(Item.category_id == category_id).all()
    return items




import uuid

#end point to attach images to a category
@category_router.post('/image_category/{category_id}/attach/',response_model=CategoryDisplay)
async def attach_image(category_id:int,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)],image:UploadFile=File(...)):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    category_db = fetch_category(category_id,db)


    #validate the image
    if not image.filename.endswith(('.png','.jpg','.jpeg')):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail='invalid image format')
    
    #check for old image
    if category_db.image_url:
        os.remove(f'uploaded_files/categories/{category_db.image_url}')
    
    #generate a unique name for the image + make sure it contains the extension
    category_db.image_url = f'{category_db.name}_{uuid.uuid4()}.{image.filename.split(".")[-1]}'
    #save the image to the uploaded_files directory
    with open(f'uploaded_files/categories/{category_db.image_url}','wb') as f:
        f.write(await image.read())
    db.commit()
    db.refresh(category_db)
    return category_db


#end point to get the image of a category
@category_router.get('/image_category/{category_id}/get/')
async def get_image(category_id:int,db:sessionDep):
    category_db = fetch_category(category_id,db)
    return FileResponse(f'uploaded_files/categories/{category_db.image_url}')


#end point to delete the image of a category
@category_router.delete('/image_category/{category_id}/delete/')
async def delete_image(category_id:int,db:sessionDep,token:Annotated[str,Depends(oauth2_scheme)]):
    user = current_user(token,db)
    verify_permission(user)    #we check if an admin is tring to perform this action
    category_db = fetch_category(category_id,db)
    if category_db.image_url:
        os.remove(f'uploaded_files/categories/{category_db.image_url}')
        category_db.image_url = None
    db.commit()
    db.refresh(category_db)
    return category_db
 