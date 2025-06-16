from fastapi import FastAPI
from app.authentication import auth_router
from app.management.items_manage import items_router
from app.management.category_manage import category_router
app = FastAPI()
app.include_router(auth_router,tags=['authentication'])
app.include_router(items_router,tags=['items'])
app.include_router(category_router,tags=['category'])

@app.get('/')
def home():
    return {"hello" : "hello world"}