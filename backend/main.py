from fastapi import FastAPI
from app.authentication import auth_router
from app.management.items_manage import items_router
from app.management.category_manage import category_router
from app.management.orders_manage import order_router
from app.management.profile import profile_router
from app.management.reviews_manage import reviews_router

app = FastAPI()
app.include_router(auth_router,tags=['authentication'])
app.include_router(items_router,tags=['items'])
app.include_router(category_router,tags=['category'])
app.include_router(order_router,tags=['orders'])
app.include_router(profile_router,tags=['profile'])
app.include_router(reviews_router,tags=['review'])

@app.get('/')
def home():
    return {"hello" : "hello world"}