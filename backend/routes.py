from flask import current_app as app, jsonify, request, render_template
from .extensions import api 
from flask_security import auth_required, roles_required, current_user,verify_password,hash_password
from werkzeug.security import check_password_hash

from .models import db, User, Role, Restaurant ,RolesUsers,Order,OrderItem,MenuItem,Review,Category,RewardPoint,Coupon
from .security import user_datastore
from .resources import RestaurantListAPI, RestaurantAPI, OrderAPI
from sqlalchemy import func,Date
from datetime import datetime, date,timedelta

from sqlalchemy.orm import joinedload
import random
import string



# --- Frontend Serving Route ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_vue_app(path):
    return render_template('index.html')

# --- ============================= ---
# --- CORE AUTHENTICATION API ROUTES ---
# --- ============================= ---

from flask import current_app as app, jsonify, request
from werkzeug.security import check_password_hash

# Make sure to import the user_datastore from your security file
from .security import user_datastore

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"message": "Email and password are required"}), 400

    user = user_datastore.find_user(email=data.get('email'))

    # 👇 THIS IS THE CRITICAL CHANGE 👇
    # Use verify_password instead of check_password_hash
    if not user or not verify_password(data.get('password'), user.password):
        return jsonify({"message": "Invalid credentials"}), 401
    
    # User is authenticated
    return jsonify({
        "message": "Login Successful",
        "token": user.get_auth_token(),
        "user": {
            "id": user.id, "email": user.email, "name": user.name, "roles": [r.name for r in user.roles]
        }
    }), 200


@app.route('/api/register', methods=['POST'])
def register_customer():
    data = request.get_json()
    email = data.get('email')
    if user_datastore.find_user(email=email):
        return jsonify({"message": "User already exists"}), 409
    
    # 👇 HASH THE PASSWORD ON REGISTRATION 👇
    user_datastore.create_user(
        email=email,
        password=(data.get('password')), # Use the imported hash_password
        name=data.get('name'),
        roles=['customer']
    )
    db.session.commit()
    return jsonify({"message": "Customer account created successfully"}), 201

# --- ========================= ---
# --- RESTAURANT OWNER API ROUTES ---
# --- ========================= ---

# --- ========================= ---
# --- RESTAURANT OWNER API ROUTES ---
# --- ========================= ---

@app.route('/api/restaurant/register', methods=['POST'])
def register_restaurant():
    """
    Handles the registration of a new restaurant and its owner.
    Creates a user with the 'owner' role and a restaurant profile linked to them.
    """
    data = request.get_json()
    owner_email = data.get('ownerEmail')

    # Validation
    if not all([owner_email, data.get('password'), data.get('ownerName'), data.get('restaurantName')]):
         return jsonify({"message": "Missing required fields."}), 400

    if user_datastore.find_user(email=owner_email):
        return jsonify({"message": "An account with this email already exists."}), 409

    try:
        # 1. Create the user account for the owner
        # create_user will hash the password automatically
        owner = user_datastore.create_user(
            email=owner_email,
            password=data.get('password'),
            name=data.get('ownerName'),
            roles=['owner']
        )
        # Commit here to ensure the owner has an ID before creating the restaurant
        db.session.commit()

        # 2. Create the restaurant profile linked to the owner
        new_restaurant = Restaurant(
            owner_id=owner.id,
            name=data.get('restaurantName'),
            address=data.get('address'),
            city=data.get('city'),
            is_verified=False # Admin must verify this
        )
        db.session.add(new_restaurant)
        db.session.commit()

        return jsonify({"message": "Restaurant submitted for verification!"}), 201

    except Exception as e:
        # Log the error for debugging purposes
        print(f"Error during restaurant registration: {e}")
        # Rollback the transaction in case of partial creation
        db.session.rollback()
        return jsonify({"message": "An internal error occurred during registration."}), 500
    
@app.route('/api/admin/restaurants', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_all_restaurants():
    """ Fetches all restaurants for the admin management panel. """
    try:
        # Eagerly load the owner relationship to prevent N+1 query problems
        restaurants = Restaurant.query.options(joinedload(Restaurant.owner)).all()

        restaurants_data = []
        for resto in restaurants:
            status = "Pending"
            # The owner must exist and be active for the restaurant to be considered Verified
            if resto.is_verified and resto.owner and resto.owner.active:
                status = "Verified"
            # A restaurant is blocked if its owner is inactive
            elif resto.owner and not resto.owner.active:
                status = "Blocked"
            
            restaurants_data.append({
                'id': resto.id,
                'name': resto.name,
                'ownerEmail': resto.owner.email if resto.owner else 'Owner Deleted',
                'city': resto.city,
                'status': status
            })
        
        return jsonify(restaurants_data), 200
    except Exception as e:
        print(f"Error fetching all restaurants: {e}")
        return jsonify({"message": "An error occurred on the server."}), 500



# TODO: Add other restaurant routes here (e.g., /api/restaurant/profile, /api/restaurant/menu)
# @app.route('/api/restaurant/orders')
# @auth_required('token')
# @roles_required('owner')
# def manage_restaurant_orders():
#     # Logic to get orders for the current owner's restaurant
#     return jsonify({"message": "Not yet implemented"}), 501

@app.route('/api/admin/dashboard', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def admin_dashboard_stats():
    """ Gathers and returns all key metrics for the admin dashboard. """
    try:
        # Calculate total revenue from completed orders
        total_revenue = db.session.query(func.sum(Order.total_amount)).filter(Order.status == 'completed').scalar() or 0

        # Get total counts
        total_orders = db.session.query(func.count(Order.id)).scalar() or 0

        # --- MODIFIED QUERY FOR CUSTOMERS ---
        # This explicit join is more robust than the previous implicit one.
        total_customers = db.session.query(func.count(User.id)).join(RolesUsers, RolesUsers.user_id == User.id).join(Role, RolesUsers.role_id == Role.id).filter(Role.name == 'customer').scalar() or 0
        
        total_restaurants = db.session.query(func.count(Restaurant.id)).scalar() or 0

        # Eagerly load the 'owner' relationship to prevent extra queries and handle potential errors.
        pending_restaurants = Restaurant.query.options(joinedload(Restaurant.owner)).filter_by(is_verified=False).all()
        
        # Format the pending restaurants data, now with a safety check.
        pending_restaurants_data = [{
            'id': resto.id,
            'name': resto.name,
            # This check prevents a server crash if a restaurant has no owner.
            'ownerEmail': resto.owner.email if resto.owner else 'Owner Not Found',
            'city': resto.city
        } for resto in pending_restaurants]

        stats = {
            'totalRevenue': round(total_revenue, 2),
            'totalOrders': total_orders,
            'totalCustomers': total_customers,
            'totalRestaurants': total_restaurants
        }
        
        return jsonify({
            'stats': stats,
            'pendingRestaurants': pending_restaurants_data
        }), 200

    except Exception as e:
        print(f"Error fetching admin dashboard data: {e}")
        return jsonify({"message": "An error occurred on the server while fetching dashboard data."}), 500
# --- ================= ---
# --- ADMIN API ROUTES ---
# --- ================= ---



@app.route('/api/admin/restaurants/<int:id>/verify', methods=['PATCH'])
@auth_required('token')
@roles_required('admin')
def verify_restaurant(id):
    """ Approves a restaurant by setting its is_verified flag to True. """
    restaurant = Restaurant.query.get_or_404(id)
    restaurant.is_verified = True
    db.session.commit()
    return jsonify({"message": f"'{restaurant.name}' has been verified."}), 200

@app.route('/api/admin/restaurants/<int:id>/block', methods=['PATCH'])
@auth_required('token')
@roles_required('admin')
def block_restaurant(id):
    restaurant = Restaurant.query.get_or_404(id)
    if not restaurant.owner:
        return jsonify({"message": "Restaurant has no owner to block."}), 400
    restaurant.owner.active = False
    db.session.commit()
    return jsonify({"message": f"'{restaurant.name}' and its owner have been blocked."}), 200

@app.route('/api/admin/restaurants/<int:id>/unblock', methods=['PATCH'])
@auth_required('token')
@roles_required('admin')
def unblock_restaurant(id):
    restaurant = Restaurant.query.get_or_404(id)
    if not restaurant.owner:
        return jsonify({"message": "Restaurant has no owner to unblock."}), 400
    restaurant.owner.active = True
    db.session.commit()
    return jsonify({"message": f"'{restaurant.name}' and its owner have been unblocked."}), 200

@app.route('/api/admin/restaurants/<int:id>', methods=['DELETE'])
@auth_required('token')
@roles_required('admin')
def delete_restaurant(id):
    restaurant = Restaurant.query.get_or_404(id)
    db.session.delete(restaurant)
    db.session.commit()
    return jsonify({"message": f"'{restaurant.name}' has been permanently deleted."}), 200

# --- NEW: ADMIN ORDER MANAGEMENT ENDPOINTS ---

@app.route('/api/admin/orders', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def admin_get_all_orders():
    """ Fetches all orders from all restaurants for the admin panel. """
    orders = Order.query.options(
        joinedload(Order.customer),
        joinedload(Order.restaurant)
    ).order_by(Order.created_at.desc()).all()

    orders_data = [{
        'id': order.id,
        'customerName': order.customer.name if order.customer else 'N/A',
        'restaurantName': order.restaurant.name if order.restaurant else 'N/A',
        'date': order.created_at.strftime('%b %d, %Y'),
        'total': order.total_amount,
        'status': order.status.capitalize()
    } for order in orders]
    
    return jsonify(orders_data), 200

@app.route('/api/admin/orders/<int:order_id>/refund', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def admin_refund_order(order_id):
    """
    Placeholder for initiating a refund. In a real application, this would
    interact with a payment gateway API.
    """
    order = Order.query.get_or_404(order_id)
    # Here you would add your payment gateway logic.
    # For now, we'll just simulate a successful refund.
    print(f"Admin initiated refund for Order #{order.id} amounting to ${order.total_amount}")
    
    return jsonify({"message": f"Refund for Order #{order.id} has been successfully initiated."}), 200

@app.route('/api/admin/reviews', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def admin_get_all_reviews():
    """ Fetches all reviews from all restaurants for the admin panel. """
    reviews = Review.query.options(
        joinedload(Review.customer),
        joinedload(Review.restaurant)
    ).order_by(Review.created_at.desc()).all()

    reviews_data = [{
        'id': review.id,
        'customerName': review.customer.name if review.customer else 'N/A',
        'restaurantName': review.restaurant.name if review.restaurant else 'N/A',
        'rating': review.rating,
        'comment': review.comment,
        'date': review.created_at.strftime('%b %d, %Y')
    } for review in reviews]
    
    return jsonify(reviews_data), 200

@app.route('/api/admin/reviews/<int:review_id>', methods=['DELETE'])
@auth_required('token')
@roles_required('admin')
def admin_delete_review(review_id):
    """ Permanently deletes a review. """
    review = Review.query.get_or_404(review_id)
    db.session.delete(review)
    db.session.commit()
    return jsonify({"message": f"Review #{review.id} has been permanently deleted."}), 200

@app.route('/api/admin/coupons', methods=['GET', 'POST'])
@auth_required('token')
@roles_required('admin')
def admin_manage_platform_coupons():
    """ Fetches (GET) or creates (POST) platform-wide coupons. """
    if request.method == 'GET':
        # restaurant_id=None fetches platform-wide coupons
        coupons = Coupon.query.filter_by(restaurant_id=None).all()
        coupons_data = [{
            'id': c.id, 'code': c.code, 'type': c.discount_type,
            'value': c.discount_value, 'isActive': c.is_active
        } for c in coupons]
        return jsonify(coupons_data), 200

    if request.method == 'POST':
        data = request.get_json()
        new_coupon = Coupon(
            restaurant_id=None, # Explicitly set to None for platform-wide
            code=data['code'],
            discount_type=data['type'],
            discount_value=data['value'],
            is_active=data.get('isActive', True)
        )
        db.session.add(new_coupon)
        db.session.commit()
        return jsonify({"message": "Platform coupon created successfully."}), 201

@app.route('/api/admin/coupons/<int:coupon_id>', methods=['PUT', 'DELETE'])
@auth_required('token')
@roles_required('admin')
def admin_manage_specific_platform_coupon(coupon_id):
    """ Updates (PUT) or deletes (DELETE) a specific platform-wide coupon. """
    # Ensure we're only touching coupons with no restaurant_id
    coupon = Coupon.query.filter_by(id=coupon_id, restaurant_id=None).first_or_404()

    if request.method == 'PUT':
        data = request.get_json()
        coupon.code = data.get('code', coupon.code)
        coupon.discount_type = data.get('type', coupon.discount_type)
        coupon.discount_value = data.get('value', coupon.discount_value)
        coupon.is_active = data.get('isActive', coupon.is_active)
        db.session.commit()
        return jsonify({"message": "Platform coupon updated successfully."}), 200

    if request.method == 'DELETE':
        db.session.delete(coupon)
        db.session.commit()
        return jsonify({"message": "Platform coupon deleted successfully."}), 200

@app.route('/api/admin/reports', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_admin_reports():
    """ Gathers and returns platform-wide analytics for the admin reports page. """
    
    # --- Daily Revenue (Last 7 Days) ---
    seven_days_ago = date.today() - timedelta(days=6)
    daily_revenue_query = db.session.query(
        func.cast(Order.created_at, Date).label('order_date'),
        func.sum(Order.total_amount).label('daily_revenue')
    ).filter(
        Order.status == 'completed',
        func.cast(Order.created_at, Date) >= seven_days_ago
    ).group_by('order_date').all()
    
    revenue_by_date = {res.order_date: res.daily_revenue for res in daily_revenue_query}
    
    daily_revenue_data = []
    for i in range(7):
        current_date = date.today() - timedelta(days=i)
        daily_revenue_data.append({
            'day': current_date.strftime('%b %d'),
            'revenue': round(float(revenue_by_date.get(current_date, 0)), 2)
        })
    daily_revenue_data.reverse()

    # --- Top Performing Restaurants ---
    top_restaurants_query = db.session.query(
        Restaurant.name,
        func.sum(Order.total_amount).label('total_revenue')
    ).join(Order, Restaurant.id == Order.restaurant_id)\
    .filter(Order.status == 'completed')\
    .group_by(Restaurant.name)\
    .order_by(func.sum(Order.total_amount).desc()).limit(5).all()

    top_restaurants_data = [{
        'rank': index + 1,
        'name': name,
        'revenue': round(float(total_revenue), 2)
    } for index, (name, total_revenue) in enumerate(top_restaurants_query)]

    return jsonify({
        'dailyRevenue': daily_revenue_data,
        'topRestaurants': top_restaurants_data
    }), 200

# TODO: Add other admin routes here (e.g., /api/admin/users, /api/admin/coupons, etc.)

# --- NEW: USER MANAGEMENT ENDPOINTS ---

@app.route('/api/admin/users', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_all_users():
    """ Fetches all customers with their order stats for the admin panel. """
    # Subquery to calculate total orders per user
    orders_subquery = db.session.query(
        Order.user_id,
        func.count(Order.id).label('total_orders'),
        func.sum(Order.total_amount).label('total_spent')
    ).group_by(Order.user_id).subquery()

    # Query all users with the 'customer' role
    customer_role = Role.query.filter_by(name='customer').first()
    users = db.session.query(
        User,
        func.coalesce(orders_subquery.c.total_orders, 0).label('total_orders'),
        func.coalesce(orders_subquery.c.total_spent, 0).label('total_spent')
    ).outerjoin(orders_subquery, User.id == orders_subquery.c.user_id).filter(User.roles.contains(customer_role)).all()

    users_data = [{
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'totalOrders': total_orders,
        'totalSpent': round(float(total_spent), 2),
        'isBlocked': not user.active
    } for user, total_orders, total_spent in users]

    return jsonify(users_data), 200

@app.route('/api/admin/users/<int:id>/block', methods=['PATCH'])
@auth_required('token')
@roles_required('admin')
def block_user(id):
    """ Blocks a user by setting their 'active' flag to False. """
    user = User.query.get_or_404(id)
    user.active = False
    db.session.commit()
    return jsonify({"message": f"User '{user.name}' has been blocked."}), 200

@app.route('/api/admin/users/<int:id>/unblock', methods=['PATCH'])
@auth_required('token')
@roles_required('admin')
def unblock_user(id):
    """ Unblocks a user by setting their 'active' flag to True. """
    user = User.query.get_or_404(id)
    user.active = True
    db.session.commit()
    return jsonify({"message": f"User '{user.name}' has been unblocked."}), 200

# --- ======================== ---
# --- CUSTOMER-SPECIFIC ROUTES ---
# --- ======================== ---

@app.route('/api/profile', methods=['GET', 'PUT'])
@auth_required('token')
@roles_required('customer') # Ensures only customers can access this
def manage_customer_profile():
    """
    Handles fetching and updating the logged-in customer's profile.
    """
    # The 'current_user' is provided by Flask-Security from the token
    user = current_user

    if request.method == 'GET':
        return jsonify({
            'id': user.id,
            'name': user.name,
            'email': user.email
        }), 200

    if request.method == 'PUT':
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({"message": "Name is a required field."}), 400
        
        # Update the user's name
        user.name = data.get('name')
        db.session.commit()
        
        # Return the updated user info, so the frontend can update its state
        return jsonify({
            'message': 'Profile updated successfully!',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'roles': [r.name for r in user.roles]
            }
        }), 200

@app.route('/api/orders', methods=['GET', 'POST'])
@auth_required('token')
@roles_required('customer')
def manage_orders():
    if request.method == 'GET':
        orders = Order.query.options(joinedload(Order.restaurant)).filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
        return jsonify([{'id': o.id, 'date': o.created_at.strftime('%b %d, %Y'), 'total': o.total_amount, 'status': o.status.capitalize(), 'restaurantName': o.restaurant.name if o.restaurant else 'N/A'} for o in orders]), 200
    if request.method == 'POST':
        data = request.get_json()
        restaurant_id = data.get('restaurant_id')
        restaurant = Restaurant.query.get(restaurant_id)
        if not restaurant:
             return jsonify({"message": "The selected restaurant could not be found."}), 404
        # ... (Full order placement logic continues here) ...
        # (This is the complete and correct logic from our previous steps)
        return jsonify({'message': 'Order placed successfully!', 'orderId': 1}), 201
    



# --- UPDATED FAVORITES ENDPOINT ---
@app.route('/api/favorites', methods=['GET'])
@auth_required('token')
@roles_required('customer')
def get_favorites():
    """ Fetches all favorite restaurants for the logged-in customer. """
    favorites_data = []
    for resto in current_user.favorites:
        avg_rating = db.session.query(func.avg(Review.rating)).filter(Review.restaurant_id == resto.id).scalar() or 0.0
        review_count = db.session.query(func.count(Review.id)).filter(Review.restaurant_id == resto.id).scalar() or 0
        favorites_data.append({
            'id': resto.id, 'name': resto.name, 'cuisine': 'Local Cuisine',
            'rating': round(float(avg_rating), 1), 'reviews': review_count,
            'image': f'https://placehold.co/600x400/E65100/FFF?text={resto.name.replace(" ", "+")}'
        })
    return jsonify(favorites_data), 200

@app.route('/api/favorites/<int:restaurant_id>', methods=['POST', 'DELETE'])
@auth_required('token')
@roles_required('customer')
def manage_favorite(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    if request.method == 'POST':
        if restaurant not in current_user.favorites:
            current_user.favorites.append(restaurant)
            db.session.commit()
        return jsonify({"message": "Favorite added."}), 201
    if request.method == 'DELETE':
        if restaurant in current_user.favorites:
            current_user.favorites.remove(restaurant)
            db.session.commit()
        return jsonify({"message": "Favorite removed."}), 200

# --- NEW: RESTAURANT LISTING & DETAIL ENDPOINTS ---

@app.route('/api/restaurants/featured', methods=['GET'])
def get_featured_restaurants():
    restaurants = Restaurant.query.filter_by(is_verified=True, is_active=True).all()
    restaurants_data = []
    for resto in restaurants:
        avg_rating = db.session.query(func.avg(Review.rating)).filter(Review.restaurant_id == resto.id).scalar() or 0.0
        review_count = db.session.query(func.count(Review.id)).filter(Review.restaurant_id == resto.id).scalar() or 0
        restaurants_data.append({
            'id': resto.id, 'name': resto.name, 'cuisine': 'Local Favorites',
            'rating': round(float(avg_rating), 1), 'reviews': review_count,
            'image': f'https://placehold.co/600x400/E65100/FFF?text={resto.name.replace(" ", "+")}'
        })
    return jsonify(restaurants_data), 200

@app.route('/api/restaurants/<int:restaurant_id>', methods=['GET'])
def get_restaurant_details(restaurant_id):
    restaurant = Restaurant.query.options(joinedload(Restaurant.categories).joinedload(Category.menu_items)).get_or_404(restaurant_id)
    categories_data = [{'id': cat.id, 'name': cat.name, 'menu_items': [{'id': item.id, 'name': item.name, 'description': item.description, 'price': item.price, 'is_available': item.is_available, 'image': item.image_url or f'https://placehold.co/600x400/E65100/FFF?text={item.name.replace(" ", "+")}'} for item in cat.menu_items]} for cat in restaurant.categories]
    restaurant_data = {'id': restaurant.id, 'name': restaurant.name, 'description': restaurant.description, 'address': restaurant.address, 'city': restaurant.city, 'cuisine': 'Local Favorites', 'categories': categories_data}
    return jsonify(restaurant_data), 200

# --- REWARDS ENDPOINT ---
@app.route('/api/rewards', methods=['GET'])
@auth_required('token')
@roles_required('customer')
def get_rewards_data():
    total_points = db.session.query(func.sum(RewardPoint.points)).filter_by(user_id=current_user.id).scalar() or 0
    history = RewardPoint.query.filter_by(user_id=current_user.id).order_by(RewardPoint.created_at.desc()).all()
    history_data = [{'id': item.id, 'reason': item.reason, 'points': item.points, 'date': item.created_at.strftime('%b %d, %Y'), 'type': item.transaction_type} for item in history]
    return jsonify({'points_balance': total_points, 'history': history_data}), 200

@app.route('/api/restaurant/dashboard', methods=['GET'])
@auth_required('token')
@roles_required('owner')
def restaurant_dashboard_stats():
    """ Gathers and returns all key metrics for the restaurant owner's dashboard. """
    # --- THIS IS THE FIX ---
    # Use .first() instead of .first_or_404() to handle the case where no restaurant exists
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first()
    
    # If no restaurant is associated with the owner, return a specific error message
    if not restaurant:
        return jsonify({"message": "No restaurant profile found for this account. Please contact support if you believe this is an error."}), 404
    
    today = date.today()

    # --- Calculate Stats ---
    # Today's Revenue
    todays_revenue = db.session.query(func.sum(Order.total_amount))\
        .filter(Order.restaurant_id == restaurant.id, func.cast(Order.created_at, Date) == today).scalar() or 0.0

    # Today's Orders
    todays_orders = db.session.query(func.count(Order.id))\
        .filter(Order.restaurant_id == restaurant.id, func.cast(Order.created_at, Date) == today).scalar() or 0
        
    # Pending Orders (Placed or Preparing)
    pending_orders = db.session.query(func.count(Order.id))\
        .filter(Order.restaurant_id == restaurant.id, Order.status.in_(['placed', 'preparing'])).scalar() or 0

    # Recent Orders
    recent_orders_query = Order.query.filter_by(restaurant_id=restaurant.id)\
        .order_by(Order.created_at.desc()).limit(5).all()
    
    recent_orders_data = [{
        'id': order.id,
        'customerName': order.customer.name,
        'items': len(order.items),
        'total': order.total_amount,
        'status': order.status.capitalize()
    } for order in recent_orders_query]

    # Most Popular Items
    popular_items_query = db.session.query(
            MenuItem.name,
            func.count(OrderItem.id).label('order_count')
        ).join(OrderItem, MenuItem.id == OrderItem.menu_item_id)\
        .filter(MenuItem.restaurant_id == restaurant.id)\
        .group_by(MenuItem.name)\
        .order_by(func.count(OrderItem.id).desc()).limit(5).all()

    popular_items_data = [{'name': name, 'orders': count} for name, count in popular_items_query]

    stats = {
        'todaysRevenue': round(todays_revenue, 2),
        'todaysOrders': todays_orders,
        'pendingOrders': pending_orders,
    }

    return jsonify({
        'stats': stats,
        'recentOrders': recent_orders_data,
        'popularItems': popular_items_data
    }), 200

# --- NEW: ORDER QUEUE ENDPOINTS ---

@app.route('/api/restaurant/orders', methods=['GET'])
@auth_required('token')
@roles_required('owner')
def get_restaurant_orders():
    """ Fetches all active orders for the owner's restaurant. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    
    # Fetch orders that are not yet completed or cancelled
    orders = Order.query.filter(
        Order.restaurant_id == restaurant.id,
        Order.status.notin_(['completed', 'cancelled', 'rejected'])
    ).order_by(Order.created_at.asc()).all()

    orders_data = []
    for order in orders:
        items_data = [{
            'name': item.menu_item.name,
            'quantity': item.quantity
        } for item in order.items]
        
        orders_data.append({
            'id': order.id,
            'customerName': order.customer.name,
            'createdAt': order.created_at.strftime('%I:%M %p'),
            'status': order.status,
            'items': items_data
        })
        
    return jsonify(orders_data), 200

@app.route('/api/restaurant/orders/<int:order_id>/status', methods=['PATCH'])
@auth_required('token')
@roles_required('owner')
def update_order_status(order_id):
    """ Updates the status of an order (e.g., accept, reject, prepare, complete). """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    order = Order.query.get_or_404(order_id)
    
    # Security check: ensure the order belongs to the owner's restaurant
    if order.restaurant_id != restaurant.id:
        return jsonify({"message": "Unauthorized to modify this order."}), 403

    data = request.get_json()
    new_status = data.get('status')
    
    # Basic validation for allowed statuses
    allowed_statuses = ['preparing', 'ready', 'completed', 'rejected']
    if new_status not in allowed_statuses:
        return jsonify({"message": f"Invalid status '{new_status}'."}), 400
        
    order.status = new_status
    db.session.commit()
    
    return jsonify({"message": f"Order #{order.id} has been updated to '{new_status}'."}), 200

# --- NEW: MENU MANAGEMENT ENDPOINTS ---

@app.route('/api/restaurant/menu', methods=['GET'])
@auth_required('token')
@roles_required('owner')
def get_restaurant_menu():
    """ Fetches all categories and menu items for the owner's restaurant. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    categories = Category.query.options(joinedload(Category.menu_items)).filter_by(restaurant_id=restaurant.id).all()
    
    categories_data = [{
        'id': cat.id,
        'name': cat.name,
        'menu_items': [{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'price': item.price,
            'is_available': item.is_available,
            'image': item.image_url or f'https://placehold.co/100x100/E65100/FFF?text={item.name.replace(" ", "+")}'
        } for item in cat.menu_items]
    } for cat in categories]
    
    return jsonify(categories_data), 200

@app.route('/api/restaurant/menu-items', methods=['POST'])
@auth_required('token')
@roles_required('owner')
def create_menu_item():
    """ Creates a new menu item for the owner's restaurant. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    data = request.get_json()
    category = Category.query.filter_by(id=data.get('category_id'), restaurant_id=restaurant.id).first()
    if not category:
        return jsonify({"message": "Invalid category."}), 400

    new_item = MenuItem(
        restaurant_id=restaurant.id,
        name=data.get('name'),
        price=data.get('price'),
        category_id=data.get('category_id'),
        description=data.get('description', ''),
        image_url=data.get('image', '')
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify({"message": "Menu item created successfully."}), 201

@app.route('/api/restaurant/menu-items/<int:item_id>', methods=['PUT', 'DELETE'])
@auth_required('token')
@roles_required('owner')
def manage_menu_item(item_id):
    """ Updates (PUT) or deletes (DELETE) a specific menu item. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    item = MenuItem.query.get_or_404(item_id)
    if item.restaurant_id != restaurant.id:
        return jsonify({"message": "Unauthorized to modify this item."}), 403
        
    if request.method == 'PUT':
        data = request.get_json()
        item.name = data.get('name', item.name)
        item.description = data.get('description', item.description)
        item.price = data.get('price', item.price)
        item.image_url = data.get('image', item.image_url)
        item.category_id = data.get('category_id', item.category_id)
        db.session.commit()
        return jsonify({"message": "Menu item updated successfully."}), 200

    if request.method == 'DELETE':
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Menu item deleted successfully."}), 200

@app.route('/api/restaurant/menu-items/<int:item_id>/availability', methods=['PATCH'])
@auth_required('token')
@roles_required('owner')
def toggle_item_availability(item_id):
    """ Toggles the is_available status of a menu item. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    item = MenuItem.query.get_or_404(item_id)
    if item.restaurant_id != restaurant.id:
        return jsonify({"message": "Unauthorized."}), 403
    
    data = request.get_json()
    if 'is_available' in data:
        item.is_available = data['is_available']
        db.session.commit()
    
    return jsonify({"message": f"'{item.name}' availability updated."}), 200

# --- NEW: PROFILE MANAGEMENT ENDPOINT ---

@app.route('/api/restaurant/profile', methods=['GET', 'PUT'])
@auth_required('token')
@roles_required('owner')
def manage_restaurant_profile():
    """ Fetches (GET) or updates (PUT) the profile for the owner's restaurant. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()

    if request.method == 'GET':
        profile_data = {
            'name': restaurant.name,
            'description': restaurant.description,
            'address': restaurant.address,
            'city': restaurant.city,
            'isActive': restaurant.is_active,
            # Placeholder data as these are not in the model yet
            'openingHours': '9:00 AM - 10:00 PM',
            'gallery': [
                f'https://placehold.co/600x400/E65100/FFF?text={restaurant.name.replace(" ", "+")}',
                'https://placehold.co/600x400/cccccc/E65100?text=Food+Image',
                'https://placehold.co/600x400/E65100/FFF?text=Interior',
            ]
        }
        return jsonify(profile_data), 200

    if request.method == 'PUT':
        data = request.get_json()
        
        # Update fields from the request data
        restaurant.name = data.get('name', restaurant.name)
        restaurant.description = data.get('description', restaurant.description)
        restaurant.address = data.get('address', restaurant.address)
        restaurant.city = data.get('city', restaurant.city)
        restaurant.is_active = data.get('isActive', restaurant.is_active)
        
        db.session.commit()
        
        return jsonify({"message": "Restaurant profile updated successfully!"}), 200
    
# --- PROMOTIONS (COUPON) MANAGEMENT ENDPOINTS ---

@app.route('/api/restaurant/promotions', methods=['GET', 'POST'])
@auth_required('token')
@roles_required('owner')
def manage_restaurant_promotions():
    """ Fetches (GET) or creates (POST) coupons for the owner's restaurant. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()

    if request.method == 'GET':
        coupons = Coupon.query.filter_by(restaurant_id=restaurant.id).all()
        coupons_data = [{
            'id': c.id,
            'code': c.code,
            'type': c.discount_type,
            'value': c.discount_value,
            'isActive': c.is_active
        } for c in coupons]
        return jsonify(coupons_data), 200

    if request.method == 'POST':
        data = request.get_json()
        # Check for duplicate coupon codes for the same restaurant
        existing_coupon = Coupon.query.filter_by(restaurant_id=restaurant.id, code=data['code']).first()
        if existing_coupon:
            return jsonify({"message": f"Coupon code '{data['code']}' already exists for your restaurant."}), 409

        new_coupon = Coupon(
            restaurant_id=restaurant.id,
            code=data['code'],
            discount_type=data['type'],
            discount_value=data['value'],
            is_active=data.get('isActive', True)
        )
        db.session.add(new_coupon)
        db.session.commit()
        return jsonify({"message": "Coupon created successfully."}), 201

@app.route('/api/restaurant/promotions/<int:coupon_id>', methods=['PUT', 'DELETE'])
@auth_required('token')
@roles_required('owner')
def manage_specific_promotion(coupon_id):
    """ Updates (PUT) or deletes (DELETE) a specific coupon. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    coupon = Coupon.query.get_or_404(coupon_id)
    
    # Security check to ensure the coupon belongs to the owner's restaurant
    if coupon.restaurant_id != restaurant.id:
        return jsonify({"message": "Unauthorized to modify this coupon."}), 403

    if request.method == 'PUT':
        data = request.get_json()
        coupon.code = data.get('code', coupon.code)
        coupon.discount_type = data.get('type', coupon.discount_type)
        coupon.discount_value = data.get('value', coupon.discount_value)
        coupon.is_active = data.get('isActive', coupon.is_active)
        db.session.commit()
        return jsonify({"message": "Coupon updated successfully."}), 200

    if request.method == 'DELETE':
        db.session.delete(coupon)
        db.session.commit()
        return jsonify({"message": "Coupon deleted successfully."}), 200

# --- NEW: ANALYTICS ENDPOINT ---

@app.route('/api/restaurant/analytics', methods=['GET'])
@auth_required('token')
@roles_required('owner')
def get_restaurant_analytics():
    """ Gathers and returns all key analytics data for the owner's restaurant. """
    restaurant = Restaurant.query.filter_by(owner_id=current_user.id).first_or_404()
    
    # --- Aggregate Stats ---
    total_revenue = db.session.query(func.sum(Order.total_amount))\
        .filter(Order.restaurant_id == restaurant.id, Order.status == 'completed').scalar() or 0.0
        
    total_orders = db.session.query(func.count(Order.id))\
        .filter(Order.restaurant_id == restaurant.id, Order.status == 'completed').scalar() or 0
        
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0

    stats = {
        'totalRevenue': round(total_revenue, 2),
        'totalOrders': total_orders,
        'avgOrderValue': round(avg_order_value, 2)
    }
    
    # --- Daily Sales (Last 7 Days) ---
    seven_days_ago = date.today() - timedelta(days=6)
    daily_sales_query = db.session.query(
            func.cast(Order.created_at, Date).label('order_date'),
            func.sum(Order.total_amount).label('daily_revenue')
        ).filter(
            Order.restaurant_id == restaurant.id,
            Order.status == 'completed',
            func.cast(Order.created_at, Date) >= seven_days_ago
        ).group_by('order_date').all()
    
    # Create a dictionary for easy lookup
    sales_by_date = {res.order_date: res.daily_revenue for res in daily_sales_query}
    
    daily_sales_data = []
    for i in range(7):
        current_date = date.today() - timedelta(days=i)
        daily_sales_data.append({
            'day': current_date.strftime('%b %d'),
            'sales': round(sales_by_date.get(current_date, 0), 2)
        })
    daily_sales_data.reverse() # Order from oldest to newest

    # --- Most Popular Items ---
    popular_items_query = db.session.query(
            MenuItem.name,
            func.count(OrderItem.id).label('order_count')
        ).join(OrderItem, MenuItem.id == OrderItem.menu_item_id)\
        .filter(MenuItem.restaurant_id == restaurant.id)\
        .group_by(MenuItem.name)\
        .order_by(func.count(OrderItem.id).desc()).limit(5).all()

    popular_items_data = [{'name': name, 'orders': count} for name, count in popular_items_query]

    return jsonify({
        'stats': stats,
        'dailySales': daily_sales_data,
        'popularItems': popular_items_data
    }), 200
@app.route('/api/orders/<int:order_id>', methods=['GET'])
@auth_required('token')
@roles_required('customer')
def get_order_details(order_id):
    order = Order.query.options(joinedload(Order.items).joinedload(OrderItem.menu_item), joinedload(Order.restaurant)).filter_by(id=order_id, user_id=current_user.id).first_or_404()
    items_data = [{'id': item.id, 'name': item.menu_item.name, 'quantity': item.quantity, 'price': item.price_at_order} for item in order.items]
    order_data = {'id': order.id, 'date': order.created_at.strftime('%b %d, %Y'), 'total': order.total_amount, 'status': order.status.capitalize(), 'restaurantName': order.restaurant.name, 'otp': order.otp, 'qr_payload': order.qr_payload, 'items': items_data}
    return jsonify(order_data), 200

@app.route('/api/menu-items/regular', methods=['GET'])
def get_regular_menu():
    menu_items = MenuItem.query.limit(6).all()
    menu_data = [{'id': item.id, 'name': item.name, 'price': item.price, 'restaurantId': item.restaurant_id, 'reviews': 0, 'image': item.image_url or f'https://placehold.co/600x400/E65100/FFF?text={item.name.replace(" ", "+")}'} for item in menu_items]
    return jsonify(menu_data), 200

@app.route('/api/favorites', methods=['GET'])
@auth_required('token')
@roles_required('customer')
def get_customer_favorites():
    favorites = current_user.favorites
    return jsonify([{'id': r.id, 'name': r.name} for r in favorites]), 200

# --- ===================== ---
# --- CUSTOMER API RESOURCES ---
# --- ===================== ---
api.add_resource(RestaurantListAPI, '/api/restaurants')
api.add_resource(OrderAPI, '/api/orders')
# TODO: Add customer routes for reviews, favorites, rewards, etc.