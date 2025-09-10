from fastapi import FastAPI,HTTPException
from typing import List
from models import OrderCreate,Customer,SessionCreate,LinkSessionRequest,InteractionCreate
import crud
from crud import link_session_to_customer,create_interaction
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:5173",  # Vite/React dev server
    "http://127.0.0.1:5173",  # sometimes browser uses 127.0.0.1
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # 👈 exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/api/dishes")
def get_dishes():
    return crud.fetch_dishes()

@app.get("/api/dishes/{dish_id}/ingredients")
def get_ingredients(dish_id: int):
    return crud.fetch_ingredients(dish_id)

@app.post("/api/orders")
def place_order(order: OrderCreate):
    order_data = [item.dict() for item in order.cart_items]
    result = crud.create_order(order.user_id, order_data)
    return result

@app.post("/api/customers/register")
def register_customer(customer: Customer):
    result = crud.register_or_get_customer(
        name=customer.name,
        email=customer.email,
        phone=getattr(customer, "phone", None),
        address=getattr(customer, "address", None),
    )
    return result

@app.post("/api/sessions")
def create_session_endpoint(session: SessionCreate):
    return crud.create_session(
        user_agent=session.user_agent,
        device_type=session.device_type,
        browser=session.browser,
        session_start=session.session_start,
        customer_id=session.customer_id
    )

@app.post("/api/sessions/link")
def link_session(request: LinkSessionRequest):
    try:
        link_session_to_customer(request.session_id, request.customer_id)
        return {
            "status": "linked",
            "session_id": request.session_id,
            "customer_id": request.customer_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/api/interactions")
def create_interaction_endpoint(interaction: InteractionCreate):
    try:
        data = interaction.dict()

        # map ingredientId inside interaction_data
        if isinstance(data.get("interaction_data"), dict):
            ingredient_id = data["interaction_data"].get("ingredientId")
            if ingredient_id:
                data["product_id"] = ingredient_id
            # store JSON string
        

        crud.create_interaction(data)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

