from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.authentication import auth_router
from app.management.items_manage import items_router
from app.management.category_manage import category_router
from app.management.orders_manage import order_router
from app.management.profile import profile_router
from app.management.reviews_manage import reviews_router
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,tags=['authentication'])
app.include_router(items_router,tags=['items'])
app.include_router(category_router,tags=['category'])
app.include_router(order_router,tags=['orders'])
app.include_router(profile_router,tags=['profile'])
app.include_router(reviews_router,tags=['review'])


#serving images
app.mount("/uploads", StaticFiles(directory="uploaded_files"), name="uploads")

@app.get('/')
def home():
    return {"hello" : "hello world"}