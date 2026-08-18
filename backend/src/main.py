from fastapi import FastAPI

from src.db import lifespan
from src.routers import notes

app = FastAPI(lifespan=lifespan)

app.include_router(notes.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, query: str | None = None):
    return {"item_id": item_id, "query": query}
