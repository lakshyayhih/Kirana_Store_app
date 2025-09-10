import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Search, Filter, Star, Clock, Users, BarChart3, TrendingUp, Eye } from 'lucide-react';
import './App.css';

function App() {
  const [selectedDish, setSelectedDish] = useState(null);
  const [cart, setCart] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [servings, setServings] = useState(4);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSession, setUserSession] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    popularDish: null,
    conversionRate: 0,
    avgOrderValue: 0
  });
  const [customer, setCustomer] = useState(null);
  const [showRegistration, setShowRegistration] = useState(true);




  // Simulated API endpoints (replace with actual backend calls)
  const API_BASE_URL = 'http://127.0.0.1:8000'; // Your backend URL





  // Database interaction functions
  const dbOperations = {
    // Track user session
    createSession: async () => {
      try {
        const sessionData = {
          user_agent: navigator.userAgent,
          device_type: /Mobile|Android|iPhone/.test(navigator.userAgent) ? 'mobile' : 'desktop',
          browser: getBrowserName(),
          session_start: new Date().toISOString()
        };

        // Send session data to backend
        const response = await fetch(`${API_BASE_URL}/api/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sessionData),
        });

        if (!response.ok) throw new Error("Failed to create session");

        const session = await response.json(); // { session_id: ..., session_token: ..., ... }

        setUserSession(session);
        return session;
      } catch (error) {
        console.error('Error creating session:', error);
      }
    },

    








    // Track user interactions
    trackInteraction: async (interactionType, data = {}) => {
    if (!userSession) return;

    try {
      const interactionData = {
        session_id: userSession.session_id,
        interaction_type: interactionType,
        dish_id: data.dishId || null,
        product_id: data.productId || null,
        search_query: data.searchQuery || null,
        filter_applied: data.filter || null,
        servings_selected: data.servings || null,
        interaction_data: data,
        created_at: new Date().toISOString()
      };

      console.log('Tracking interaction:', interactionData);

      await fetch("http://127.0.0.1:8000/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(interactionData)
      });

    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  },


    // Fetch dishes from database 
    fetchDishes: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dishes`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const dishes = await response.json();
        return dishes.map(d => ({ ...d, ingredients: [] }));
      } catch (error) {
        console.error('Error fetching dishes:', error);
        return getSampleDishes(); // fallback to sample data
      }
    },

   // Fetch Ingradients
    fetchIngredients: async (dishId) => {
      try {
        console.log(`Fetching ingredients for dish ID: ${dishId}`);
        const response = await fetch(`${API_BASE_URL}/api/dishes/${dishId}/ingredients`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const ingredients = await response.json();
        console.log('Fetched ingredients:', ingredients);
        return ingredients;
      } catch (error) {
        console.error(`Error fetching ingredients for dish ${dishId}:`, error);
        // Fallback: get ingredients from sample data
        const sampleDishes = getSampleDishes();
        const dish = sampleDishes.find(d => d.dish_id === dishId);
        return dish ? dish.ingredients : [];
      }
    },

    // Fetch categories from database
    fetchCategories: async () => {
      try {
        return getSampleCategories();
      } catch (error) {
        console.error('Error fetching categories:', error);
        return getSampleCategories();
      }
    },

    // Create order in database
    createOrder: async (orderData) => {
      if (!orderData.user_id) {
        throw new Error("User not registered or session expired");
      }

      try {
        console.log("Sending order to backend:", orderData);

        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to create order. Status: ${response.status}, ${text}`);
        }

        const order = await response.json();

        // Track order completion
        await dbOperations.trackInteraction("order_complete", {
          orderId: order.order_id,
          totalAmount: order.total_amount,
        });

        return order;
      } catch (error) {
        console.error("Error creating order:", error);
        throw error;
      }
    }

,

    // Update dish popularity
    updateDishPopularity: async (dishId) => {
      try {
        console.log('Updating popularity for dish:', dishId);
        // Update analytics
        setAnalytics(prev => ({
          ...prev,
          totalViews: prev.totalViews + 1
        }));
      } catch (error) {
        console.error('Error updating dish popularity:', error);
      }
    },

    // Get analytics data
    fetchAnalytics: async () => {
      try {
        const analyticsData = {
          totalViews: Math.floor(Math.random() * 1000) + 100,
          conversionRate: (Math.random() * 10 + 2).toFixed(1),
          avgOrderValue: Math.floor(Math.random() * 500) + 200,
          popularDish: 'Dal Tadka'
        };
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    }
  };

  // Utility functions
  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  // Sample data
  const getSampleDishes = () => [
    {
      dish_id: 1,
      dish_name: 'Dal Tadka',
      category_id: 1,
      difficulty: 'Easy',
      cooking_time_minutes: 30,
      description: 'Classic yellow lentil curry with aromatic tempering',
      emoji: '🍛',
      total_orders: 1250,
      avg_rating: 4.5,
      ingredients: [
        { ingredient_id: 1, ingredient_name: 'Tuvar Dal', quantity_needed: 1, unit: 'cup', price_per_unit: 120 },
        { ingredient_id: 2, ingredient_name: 'Onion', quantity_needed: 2, unit: 'medium', price_per_unit: 40 },
        { ingredient_id: 3, ingredient_name: 'Tomato', quantity_needed: 2, unit: 'medium', price_per_unit: 50 },
        { ingredient_id: 4, ingredient_name: 'Cumin Seeds', quantity_needed: 1, unit: 'tsp', price_per_unit: 200 },
        { ingredient_id: 5, ingredient_name: 'Turmeric Powder', quantity_needed: 0.5, unit: 'tsp', price_per_unit: 150 },
        { ingredient_id: 6, ingredient_name: 'Mustard Seeds', quantity_needed: 0.5, unit: 'tsp', price_per_unit: 180 },
        { ingredient_id: 7, ingredient_name: 'Red Chili Powder', quantity_needed: 1, unit: 'tsp', price_per_unit: 300 },
        { ingredient_id: 8, ingredient_name: 'Cooking Oil', quantity_needed: 2, unit: 'tbsp', price_per_unit: 140 },
        { ingredient_id: 9, ingredient_name: 'Salt', quantity_needed: 1, unit: 'tsp', price_per_unit: 20 }
      ]
    }
    // ... add more dishes as needed
  ];

  const getSampleCategories = () => [
    { category_id: 1, category_name: 'Dal & Curry', category_icon: '🍛' },
    { category_id: 2, category_name: 'Vegetables', category_icon: '🥬' },
    { category_id: 3, category_name: 'Rice', category_icon: '🍚' },
    { category_id: 4, category_name: 'Bread', category_icon: '🫓' }
  ];

  // Initialize component
  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      
      // Create user session
      await dbOperations.createSession();
      
      // Fetch data
      const [dishesData, categoriesData] = await Promise.all([
        dbOperations.fetchDishes(),
        dbOperations.fetchCategories(),
        dbOperations.fetchAnalytics()
      ]);
      
      setDishes(dishesData);
      setCategories([
        { category_id: 'all', category_name: 'All Dishes', category_icon: '🍽️' },
        ...categoriesData
      ]);
      
      setLoading(false);
    };

    initializeApp();
  }, []);

  // Track search interactions
  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        dbOperations.trackInteraction('search', { searchQuery: searchTerm });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  // Track filter changes
  useEffect(() => {
    if (filterCategory !== 'all') {
      dbOperations.trackInteraction('filter', { filter: filterCategory });
    }
  }, [filterCategory]);

  // Track serving changes
  useEffect(() => {
    if (servings !== 4) {
      dbOperations.trackInteraction('serving_change', { servings });
    }
  }, [servings]);

  // Filter dishes based on search and category
  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.dish_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || dish.category_id === parseInt(filterCategory);
    return matchesSearch && matchesCategory;
  });

  // Handle dish view tracking - FIXED VERSION
  const handleDishView = async (dish) => {
    const isSameDish = selectedDish?.dish_id === dish.dish_id;

    if (isSameDish) {
      setSelectedDish(null); // collapse if already selected
      return;
    }

    console.log('Handling dish view for:', dish.dish_name);

    try {
      // Fetch ingredients from API (or fallback to sample data)
      const ingredients = await dbOperations.fetchIngredients(dish.dish_id);
      console.log('Ingredients fetched:', ingredients);

      // Attach ingredients to the dish object
      const dishWithIngredients = { ...dish, ingredients };
      setSelectedDish(dishWithIngredients);

      // Track analytics
      await dbOperations.trackInteraction('dish_view', { dishId: dish.dish_id });
      await dbOperations.updateDishPopularity(dish.dish_id);
    } catch (error) {
      console.error('Error in handleDishView:', error);
      // Fallback: set dish without ingredients
      setSelectedDish({ ...dish, ingredients: [] });
    }
  };

  // Handle add to cart
  const addToCart = async (ingredient, dish) => {
    const key = `${ingredient.ingredient_id}_${dish.dish_id}`;
    const calculatedQuantity = (ingredient.quantity_needed * servings / 4);
    const totalPrice = ingredient.price_per_unit * calculatedQuantity ;

    setCart(prev => ({
      ...prev,
      [key]: {
        ...ingredient,
        dish_id: dish.dish_id,
        dish_name: dish.dish_name,
        calculated_quantity: calculatedQuantity,
        total_price: totalPrice,
        servings: servings
      }
    }));

    await dbOperations.trackInteraction('ingredient_add', {
      dishId: dish.dish_id,
      ingredientId: ingredient.ingredient_id
    });
  };

  // Handle checkout
  const handleCheckout = async () => {
  if (Object.keys(cart).length === 0) {
    alert("Cart is empty!");
    return;
  }

  if (!userSession?.user_id) {
    alert("Please register before placing an order.");
    return;
  }

  await dbOperations.trackInteraction("checkout_start", {
    cartItems: Object.keys(cart).length,
    totalAmount: getTotalCartValue(),
  });

  // Group cart items by dish
  const orderData = {
    user_id: userSession.user_id,
    cart_items: Object.values(cart).reduce((acc, item) => {
      const existingDish = acc.find((d) => d.dish_id === item.dish_id);
      if (existingDish) {
        existingDish.ingredients.push({
          ingredient_id: item.ingredient_id,
          quantity: item.calculated_quantity,
          unit: item.unit,
        });
      } else {
        acc.push({
          dish_id: item.dish_id,
          servings: item.servings,
          ingredients: [
            {
              ingredient_id: item.ingredient_id,
              quantity: item.calculated_quantity,
              unit: item.unit,
            },
          ],
        });
      }
      return acc;
    }, []),
  };

  try {
    const order = await dbOperations.createOrder(orderData);
    if (order) {
      alert(`Order placed successfully! Order ID: ${order.order_number || order.order_id}`);
      setCart({});
    }
  } catch (error) {
    alert(`Error placing order: ${error.message}`);
  }
};



  // Calculate total cart value
  const getTotalCartValue = () => {
    return Object.values(cart).reduce((total, item) => total + (item.total_price || 0), 0);
  };

  // Calculate quantity based on servings
  const calculateQuantity = (baseQuantity, baseServings = 4) => {
    const multiplier = servings / baseServings;
    const qty = (baseQuantity * multiplier).toFixed(1);
    return qty;
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'easy';
      case 'Medium': return 'medium';
      case 'Hard': return 'hard';
      default: return 'easy';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading dishes...</p>
        </div>
      </div>
    );
  }
  








  return (
  <div>
    {showRegistration && !customer ? (
      <RegistrationModal
          userSession={userSession}  // pass it here
          onRegister={(cust) => {
            setCustomer(cust);
            setUserSession({ ...userSession, user_id: cust.user_id });
            setShowRegistration(false);
          }}
        />
    ) : (
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="container">
            <div className="header-content">
              <div className="brand">
                <h1>KiranaKart Pro</h1>
                <p>Order groceries by dish • Analytics Enabled</p>
              </div>

              <div className="cart-button">
                <button onClick={handleCheckout} className="btn-primary">
                  <ShoppingCart size={20} />
                  <span>₹{getTotalCartValue().toFixed(0)}</span>
                  <span className="cart-count">{Object.keys(cart).length}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container main-content">
          <div className="grid">
            {/* Left Panel - Dishes */}
            <div className="dishes-panel">
              {/* Search and Filter */}
              <div className="search-filter-card">
                <div className="search-filter-content">
                  <div className="search-input-container">
                    <Search size={20} />
                    <input
                      type="text"
                      placeholder="Search dishes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="servings-selector">
                    <Users size={20} />
                    <span>Servings:</span>
                    <select
                      value={servings}
                      onChange={(e) => setServings(Number(e.target.value))}
                      className="servings-select"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={4}>4</option>
                      <option value={6}>6</option>
                      <option value={8}>8</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="categories-container">
                {categories.map((category) => (
                  <button
                    key={category.category_id}
                    onClick={() => setFilterCategory(category.category_id.toString())}
                    className={`category-btn ${
                      filterCategory === category.category_id.toString() ? "active" : ""
                    }`}
                  >
                    <span>{category.category_icon}</span>
                    <span>{category.category_name}</span>
                  </button>
                ))}
              </div>

              {/* Dishes Grid */}
              <div className="dishes-grid">
                {filteredDishes.map((dish) => (
                  <div key={dish.dish_id} className="dish-card">
                    <div className="dish-header">
                      <div className="dish-emoji">{dish.emoji}</div>
                      <div className="dish-badges">
                        <span className={`difficulty-badge ${getDifficultyColor(dish.difficulty)}`}>
                          {dish.difficulty}
                        </span>
                        <div className="rating">
                          <Star size={16} className="star-icon" />
                          <span>{dish.avg_rating || 4.5}</span>
                        </div>
                      </div>
                    </div>

                    <h3 className="dish-name">{dish.dish_name}</h3>
                    <p className="dish-description">{dish.description}</p>

                    <div className="dish-info">
                      <div className="info-item">
                        <Clock size={16} />
                        <span>{dish.cooking_time_minutes} mins</span>
                      </div>
                      <div className="info-item">
                        <Users size={16} />
                        <span>{servings} servings</span>
                      </div>
                      <div className="info-item">
                        <TrendingUp size={16} />
                        <span>{dish.total_orders || 0} orders</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDishView(dish)}
                      className={`dish-toggle-btn ${
                        selectedDish?.dish_id === dish.dish_id ? "active" : ""
                      }`}
                    >
                      {selectedDish?.dish_id === dish.dish_id
                        ? "Hide Ingredients"
                        : "Show Ingredients"}
                    </button>

                    {/* Ingredients List */}
                    {selectedDish?.dish_id === dish.dish_id && selectedDish.ingredients && (
                      <div className="ingredients-section">
                        <h4>Required Ingredients:</h4>
                        {selectedDish.ingredients.length > 0 ? (
                          <>
                            <div className="ingredients-list">
                              {selectedDish.ingredients.map((ingredient, index) => (
                                <div
                                  key={ingredient.ingredient_id || index}
                                  className="ingredient-item"
                                >
                                  <div className="ingredient-info">
                                    <div className="ingredient-name">
                                      {ingredient.ingredient_name}
                                    </div>
                                    <div className="ingredient-details">
                                      {calculateQuantity(ingredient.quantity_needed)}{" "}
                                      {ingredient.unit} • ₹{ingredient.price_per_unit}/
                                      {ingredient.unit}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => addToCart(ingredient, selectedDish)}
                                    className="add-to-cart-btn"
                                  >
                                    Add to Cart
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="add-all-section">
                              <button
                                onClick={() => {
                                  selectedDish.ingredients.forEach((ingredient) =>
                                    addToCart(ingredient, selectedDish)
                                  );
                                }}
                                className="add-all-btn"
                              >
                                Add All Ingredients to Cart
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="no-ingredients">
                            <p>No ingredients available for this dish.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Cart */}
            <div className="sidebar">
              <div className="cart-section">
                <h3 className="section-title">
                  <ShoppingCart size={20} />
                  Shopping Cart
                </h3>

                {Object.keys(cart).length === 0 ? (
                  <div className="empty-cart">
                    <ShoppingCart size={48} className="empty-cart-icon" />
                    <p>Your cart is empty</p>
                    <p className="empty-cart-subtitle">Select a dish to add ingredients</p>
                  </div>
                ) : (
                  <div className="cart-content">
                    {Object.values(cart).map((item, index) => (
                      <div key={index} className="cart-item">
                        <div className="cart-item-info">
                          <div className="cart-item-name">{item.ingredient_name}</div>
                          <div className="cart-item-dish">{item.dish_name}</div>
                          <div className="cart-item-quantity">
                            {item.calculated_quantity} {item.unit}
                          </div>
                        </div>
                        <div className="cart-item-price">
                          ₹{(item.total_price || 0).toFixed(0)}
                        </div>
                      </div>
                    ))}

                    <div className="cart-total">
                      <div className="total-row">
                        <span>Total</span>
                        <span className="total-amount">₹{getTotalCartValue().toFixed(0)}</span>
                      </div>

                      <button onClick={handleCheckout} className="checkout-btn">
                        Proceed to Checkout
                      </button>

                      <button onClick={() => setCart({})} className="clear-cart-btn">
                        Clear Cart
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);


     
}


function RegistrationModal({ onRegister,userSession }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");


  const handleSubmit = async () => {
  try {
    // 1️⃣ Register the customer
    const response = await fetch("http://127.0.0.1:8000/api/customers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, address }),
    });

    if (!response.ok) throw new Error("Failed to register customer");

    const data = await response.json();
    console.log("Customer ID:", data.CustomerId);

    // 2️⃣ Update parent App state
    onRegister({
      ...data,
      user_id: data.CustomerId,
    });

    // 3️⃣ Link session to customer
    console.log("Session ID:", userSession.session_id);
    if (userSession?.session_id) {
        await fetch("http://127.0.0.1:8000/api/sessions/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: userSession.session_id, customer_id: data.CustomerId }),
        });
      }
    
    } catch (error) {
      console.error("Error registering customer or linking session:", error);
    }
};


  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Register to Continue</h2>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Your Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Your Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleSubmit} style={styles.button}>
          Register
        </button>
      </div>
    </div>
  );
}


const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // dark background
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    padding: "2rem",
    borderRadius: "12px",
    width: "400px",
    maxWidth: "90%",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    textAlign: "center",
  },
  title: {
    marginBottom: "1rem",
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    padding: "0.8rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  button: {
    padding: "0.8rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
};






export default App;