from app.database import engine,Base
from app import models

models.Base.metadata.create_all(bind=engine)

