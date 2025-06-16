import jwt
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from fastapi import Depends,routing
from typing import Annotated
from datetime import datetime,timedelta
from app.dependencies import sessionDep
from app.schemas.users_schemas import UserCreate,UserDisplay
from app.models.users import User
from fastapi.exceptions import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi import status
from sqlalchemy import or_

SECRET_KEY = 'n4f44r7232jxe23m23rc4r84e?9391!181669344cnfr44rh34ur23r'
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRES_MINUTES = 30

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='auth/login/')


pwd_context = CryptContext(schemes=['bcrypt'],deprecated='auto')


def create_access_token(data:dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    to_encode.update({'exp':expire})
    return jwt.encode(to_encode,SECRET_KEY,ALGORITHM)



auth_router = routing.APIRouter(
    prefix='/auth'
)



@auth_router.post('/register/',response_model=UserDisplay)
def register(user:UserCreate,db:sessionDep):
    user_indb = db.query(User).filter(   #check if the user already exists
        or_(
            User.email == user.email,
            User.username == user.username,
            User.phone == user.phone

        )
    ).first()
    if user_indb:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="user with this username/email is already registered")

   
    hashed_password = pwd_context.hash(user.password)
    user_data = user.model_dump()    #extract the data
    user_data["password"] = hashed_password   #replace with the hashed password
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate(email:str,password:str, db:sessionDep):
    #first we query the user
    user = db.query(User).filter(User.email==email).first()
    if not user:
        return False
    if not pwd_context.verify(password,user.password):
        return False
    return user   #the user is legitimate to login


@auth_router.post('/login/')
def login(form_data : Annotated[OAuth2PasswordRequestForm,Depends()],db:sessionDep):
    print(form_data.username)
    user = authenticate(form_data.username,form_data.password,db)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail='we could not authenticate you, verify your username or password'
        )
    #now we need to generate an access token
    data = {
        'sub' : user.email,
        'user_id' : user.id   #will be needed to determin the current user
    }
    token = create_access_token(data)
    return {
        "access_token" : token,
        "token_type" : "bearer"
    }


def verify_access_token(token:str):
    try:
        payload = jwt.decode(token,SECRET_KEY,ALGORITHM)
        return payload
    except:
        return None
    
from app.database import session_local
def current_user(token:Annotated[str,oauth2_scheme],db:Session):
    
    payload = verify_access_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    email = payload['sub']

    user = db.query(User).filter(User.email==email).first()
    return user

@auth_router.get('/current_user/',response_model=UserDisplay)
async def ge_current_user(token:Annotated[str,Depends(oauth2_scheme)],db:sessionDep):
    return current_user(token,db)
    

    
    


