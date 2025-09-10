from database import get_connection
from datetime import datetime
from decimal import Decimal


def fetch_dishes():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM dishes")
    dishes = cursor.fetchall()
    cursor.close()
    conn.close()
    return dishes

def fetch_ingredients(dish_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.ProductId as ingredient_id, p.ProductName as ingredient_name, p.unit as unit , p.BasePrice as price_per_unit, di.quantity_needed as quantity_needed
        FROM dish_ingredients di
        JOIN products p ON di.product_id = p.ProductId
        WHERE di.dish_id = %s
    """, (dish_id,))
    ingredients = cursor.fetchall()
    cursor.close()
    conn.close()
    return ingredients


def create_order(customer_id, cart_items):
    conn = get_connection()
    cursor = conn.cursor()
    
    # Insert into orders table
    cursor.execute("""
        INSERT INTO orders (CustomerId, OrderDate, Status, TotalAmount)
        VALUES (%s, %s, %s, %s)
    """, (customer_id, datetime.now(), "PEND", 0))  
    
    order_id = cursor.lastrowid
    total_amount = 0
    
    for item in cart_items:
        dish_id = item['dish_id']
        servings = item['servings']
        
        for ing in item['ingredients']:
            quantity = ing['quantity'] * servings / 4  # scale ingredient
            
            cursor.execute("SELECT ProductId, Baseprice FROM Products WHERE ProductId=%s", (ing['ingredient_id'],))
            product_id, unit_price = cursor.fetchone()
            
            total_price = Decimal(quantity) * unit_price
            
            cursor.execute("""
                INSERT INTO order_details 
                    (OrderId, DishId, ProductId, Quantity, Unit, UnitPrice, Servings)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (order_id, dish_id, product_id, quantity, ing['unit'], unit_price, servings))
            
            total_amount += total_price
    
    # Update total amount in orders table
    cursor.execute("UPDATE orders SET TotalAmount=%s WHERE OrderId=%s", (total_amount, order_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"order_id": order_id, "total_amount": total_amount}

def register_or_get_customer(name, email, phone=None, address=None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Check if customer exists by email
    cursor.execute("SELECT CustomerId, Name, Email FROM customers WHERE Email = %s", (email,))
    existing = cursor.fetchone()

    if existing:
        cursor.close()
        conn.close()
        return existing

    # Insert new customer
    cursor.execute("""
        INSERT INTO customers (Name, Email, Phone, Address, DateRegistered)
        VALUES (%s, %s, %s, %s, %s)
    """, (name, email, phone, address, datetime.now()))
    conn.commit()

    new_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {"CustomerId": new_id, "Name": name, "Email": email}


def create_session(user_agent, device_type, browser, session_start, customer_id=None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Convert ISO datetime to MySQL DATETIME string
    if isinstance(session_start, str):
        session_start = session_start.replace("T", " ").replace("Z", "")
    elif isinstance(session_start, datetime):
        session_start = session_start.strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO sessions (user_agent, device_type, browser, session_start, customer_id)
        VALUES (%s, %s, %s, %s, %s)
    """, (user_agent, device_type, browser, session_start, customer_id))
    conn.commit()
    session_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return {
        "session_id": session_id
    }


def link_session_to_customer(session_id, customer_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sessions SET customer_id = %s WHERE session_id = %s", (customer_id, session_id))
    conn.commit()
    cursor.close()
    conn.close()

def create_interaction(data: dict):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        INSERT INTO interactions 
        (session_id, interaction_type, dish_id,ProductId, search_query, filter_applied, servings_selected, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    values = (
        data.get("session_id"),
        data.get("interaction_type"),
        data.get("dish_id"),
        data.get("product_id"),  # mapping snake_case → DB column
        data.get("search_query"),
        data.get("filter_applied"),
        data.get("servings_selected"),
        data.get("created_at"),
    )

    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()
