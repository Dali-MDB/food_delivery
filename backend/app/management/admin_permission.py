from app.schemas.users_schemas import User
from fastapi.exceptions import HTTPException
from fastapi import status


def verify_permission(user:User):
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail='you are not authorized to do this action')