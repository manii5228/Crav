import random
import string
from flask_restful import Resource, reqparse, fields, marshal_with
from flask_security import auth_required, current_user
from .models import db, User, Restaurant, MenuItem, Category, Order, OrderItem

# --- Output Field Definitions for Marshalling ---
# This controls the JSON output, preventing sensitive data exposure.

user_fields = {
    'id': fields.Integer,
    'email': fields.String,
    'name': fields.String,
}

menu_item_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'price': fields.Float,
    'is_available': fields.Boolean
}

category_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'menu_items': fields.List(fields.Nested(menu_item_fields))
}

# For showing a list of restaurants
restaurant_list_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'address': fields.String,
    'city': fields.String
}

# For showing a single restaurant's detailed view
restaurant_detail_fields = {
    'id': fields.Integer,
    'name': fields.String,
    'description': fields.String,
    'address': fields.String,
    'city': fields.String,
    'owner': fields.Nested(user_fields),
    'categories': fields.List(fields.Nested(category_fields))
}

order_item_fields = {
    'menu_item_name': fields.String(attribute='menu_item.name'),
    'quantity': fields.Integer,
    'price_at_order': fields.Float
}

order_fields = {
    'id': fields.Integer,
    'total_amount': fields.Float,
    'status': fields.String,
    'created_at': fields.DateTime,
    'restaurant_name': fields.String(attribute='restaurant.name'),
    'items': fields.List(fields.Nested(order_item_fields))
}

# --- Request Parsers for Input Validation ---

order_parser = reqparse.RequestParser()
order_parser.add_argument('restaurant_id', type=int, required=True, help='Restaurant ID is required')
order_parser.add_argument('order_type', type=str, required=True, choices=('takeaway', 'dine_in'), help='Order type is required')
order_parser.add_argument('items', type=list, location='json', required=True, help='Order items are required')


# --- API Resource Classes ---

class RestaurantListAPI(Resource):
    @auth_required('token')
    @marshal_with(restaurant_list_fields)
    def get(self):
        """ Returns a list of all verified and active restaurants """
        restaurants = Restaurant.query.filter_by(is_verified=True, is_active=True).all()
        return restaurants

class RestaurantAPI(Resource):
    @auth_required('token')
    @marshal_with(restaurant_detail_fields)
    def get(self, restaurant_id):
        """ Returns details of a specific restaurant, including its menu """
        restaurant = Restaurant.query.get_or_404(restaurant_id)
        return restaurant

class OrderAPI(Resource):
    @auth_required('token')
    def get(self):
        """ Returns the order history for the current user """
        orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
        # We use marshal manually here because of the nested structure
        from flask_restful import marshal
        return marshal(orders, order_fields)

    @auth_required('token')
    def post(self):
        """ Places a new order for the current user """
        args = order_parser.parse_args()
        
        # Check if restaurant exists
        restaurant = Restaurant.query.get_or_404(args['restaurant_id'])
        
        total_amount = 0
        order_items_to_create = []

        # Validate items and calculate total
        for item_data in args['items']:
            menu_item = MenuItem.query.get(item_data['menu_item_id'])
            if not menu_item or not menu_item.is_available or menu_item.restaurant_id != restaurant.id:
                return {'message': f"Menu item with id {item_data['menu_item_id']} is invalid or unavailable"}, 400
            
            quantity = item_data['quantity']
            total_amount += menu_item.price * quantity
            
            order_items_to_create.append(OrderItem(
                menu_item_id=menu_item.id,
                quantity=quantity,
                price_at_order=menu_item.price
            ))

        if not order_items_to_create:
            return {'message': 'Order must contain at least one item'}, 400

        # Generate unique OTP and QR payload
        otp = ''.join(random.choices(string.digits, k=6))
        qr_payload = ''.join(random.choices(string.ascii_letters + string.digits, k=20))

        # Create the order
        new_order = Order(
            user_id=current_user.id,
            restaurant_id=restaurant.id,
            total_amount=round(total_amount, 2),
            order_type=args['order_type'],
            otp=otp,
            qr_payload=qr_payload,
            items=order_items_to_create
        )

        db.session.add(new_order)
        db.session.commit()

        return {'message': 'Order placed successfully', 'order_id': new_order.id}, 201