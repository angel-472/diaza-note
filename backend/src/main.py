from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.db import lifespan
from src.routers import notes
from src import auth

app = FastAPI(lifespan=lifespan)

# Open to any origin because external services call this API. Credentials are
# off deliberately: auth travels in the Authorization header, and turning them
# on would make Starlette echo the caller's origin instead of "*", which would
# hand every site on the internet credentialed access.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Everything lives under /api so the browser client can be served same-origin
# from lunonote.com/api/*. The prefix is applied here rather than stripped by a
# proxy, so dev and prod expose identical paths and there is no rewrite rule to
# keep in sync. Same-origin also means the session cookie works again, and can
# stay httpOnly where JavaScript cannot read it.
app.include_router(auth.router, prefix="/api")
app.include_router(notes.router, prefix="/api")


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, query: str | None = None):
    return {"item_id": item_id, "query": query}
