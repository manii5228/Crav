from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from datetime import datetime
from .extensions import db 

# Initialize the SQLAlchemy object.
# This object will be imported into your main app.py to be initialized with the Flask app.

# Association table for the many-to-many relationship between Users and Roles
class RolesUsers(db.Model):
    __tablename__ = 'roles_users'
    id = db.Column(db.Integer(), primary_key=True)
    user_id = db.Column('user_id', db.Integer(), db.ForeignKey('user.id'))
    role_id = db.Column('role_id', db.Integer(), db.ForeignKey('role.id'))

# Role model for Flask-Security
class Role(db.Model, RoleMixin):
    __tablename__ = 'role'
    id = db.Column(db.Integer(), primary_key=True)
    name = db.Column(db.String(80), unique=True)
    description = db.Column(db.String(255))

# User model for all roles (Customer, Owner, Admin)
class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255))
    active = db.Column(db.Boolean()) # Used by Flask-Security to block users (active=False)
    fs_uniquifier = db.Column(db.String(64), unique=True, nullable=False) # Required by Flask-Security-Too
    roles = db.relationship('Role', secondary='roles_users', backref=db.backref('users', lazy='dynamic'))

    # Relationships
    orders = db.relationship('Order', backref='customer', lazy=True)
    reviews = db.relationship('Review', backref='customer', lazy=True)
    favorites = db.relationship('Restaurant', secondary='favorite', backref='favorited_by', lazy='dynamic')
    
# --- Application-Specific Models ---

class Restaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True) # Toggled by owner
    
    # Relationships
    owner = db.relationship('User', backref='restaurants_owned')
    menu_items = db.relationship('MenuItem', backref='restaurant', lazy=True, cascade="all, delete-orphan")
    categories = db.relationship('Category', backref='restaurant', lazy=True, cascade="all, delete-orphan")
    orders = db.relationship('Order', backref='restaurant', lazy=True)
    reviews = db.relationship('Review', backref='restaurant', lazy=True, cascade="all, delete-orphan")

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    
    # Relationships
    menu_items = db.relationship('MenuItem', backref='category', lazy=True)

class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    is_available = db.Column(db.Boolean, default=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='placed') # e.g., placed, preparing, ready, completed
    order_type = db.Column(db.String(50), nullable=False) # e.g., takeaway, dine_in
    otp = db.Column(db.String(6), nullable=False)
    qr_payload = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    scheduled_time = db.Column(db.DateTime, nullable=True) # For future orders
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete-orphan")

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_item.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_order = db.Column(db.Float, nullable=False) # Price of the item when the order was placed
    
    # Relationships
    menu_item = db.relationship('MenuItem')

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False, unique=True)
    rating = db.Column(db.Integer, nullable=False) # Rating from 1 to 5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
# Association table for user favorites
class Favorite(db.Model):
    __tablename__ = 'favorite'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)

class RewardPoint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True) # Can be null for manual points or redemptions
    points = db.Column(db.Integer, nullable=False) # Can be positive (earn) or negative (redeem)
    transaction_type = db.Column(db.String(50), nullable=False) # 'earn' or 'redeem'
    reason = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Coupon(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    # If restaurant_id is NULL, it's a platform-wide coupon (for admins)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_type = db.Column(db.String(50), nullable=False) # 'Percentage' or 'Fixed'
    discount_value = db.Column(db.Float, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # Relationship
    restaurant = db.relationship('Restaurant', backref='coupons')