from pydantic import BaseModel
from typing import List, Optional,Any
from datetime import datetime

class IngredientItem(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str

class CartItem(BaseModel):
    dish_id: int
    ingredients: List[IngredientItem]
    servings: int

class OrderCreate(BaseModel):
    user_id: Optional[int] = None
    cart_items: List[CartItem]

class Customer(BaseModel):
    name: str
    email: str
    phone: str | None = None
    address: str | None = None

class SessionCreate(BaseModel):
    user_agent: str
    device_type: str
    browser: str
    session_start: str
    customer_id: Optional[int] = None

class SessionDB(SessionCreate):
    session_id: int

class LinkSessionRequest(BaseModel):
    session_id: int
    customer_id: int

class InteractionCreate(BaseModel):
    session_id: int
    interaction_type: str
    dish_id: Optional[int] = None
    product_id: Optional[int] = None   # frontend uses product_id
    search_query: Optional[str] = None
    filter_applied: Optional[str] = None
    servings_selected: Optional[int] = None
    interaction_data: Any
    created_at: datetime