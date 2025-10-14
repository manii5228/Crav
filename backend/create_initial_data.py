from app import app
from backend.extensions import db
from backend.security import user_datastore
from backend.models import Restaurant, Category, MenuItem

def create_data():
    """Function to create initial roles, users, and sample data."""
    with app.app_context():
        db.create_all()
        
        # Role creation
        user_datastore.find_or_create_role(name='admin', description='Superuser')
        user_datastore.find_or_create_role(name='customer', description='General customer')
        user_datastore.find_or_create_role(name='owner', description='Restaurant owner')

        # User creation
        if not user_datastore.find_user(email='admin@email.com'):
            user_datastore.create_user(email='admin@email.com', password='admin123', roles=['admin'])
        
        if not user_datastore.find_user(email='customer1@email.com'):
            user_datastore.create_user(email='customer1@email.com', password='cust123', roles=['customer'])
        
        if not user_datastore.find_user(email='owner1@email.com'):
            user_datastore.create_user(email='owner1@email.com', password='owner123', roles=['owner'])
        
        db.session.commit()

        owner_user = user_datastore.find_user(email='owner1@email.com')
        if owner_user and not Restaurant.query.filter_by(owner_id=owner_user.id).first():
            new_resto = Restaurant(
                owner_id=owner_user.id,
                name="Owner One's Eatery",
                description="A default restaurant for testing.",
                address="123 Food St",
                city="Flavor Town",
                # --- ✅ START: ADDED GEOLOCATION DATA ---
                # Example coordinates for New York City
                latitude=40.7128,
                longitude=-74.0060,
                # --- ✅ END: ADDED GEOLOCATION DATA ---
                is_verified=True 
            )
            db.session.add(new_resto)
            db.session.commit()

            if not Category.query.filter_by(restaurant_id=new_resto.id).first():
                cat1 = Category(name="Appetizers", restaurant_id=new_resto.id)
                cat2 = Category(name="Main Courses", restaurant_id=new_resto.id)
                db.session.add_all([cat1, cat2])
                db.session.commit()

                item1 = MenuItem(name="Spring Rolls", description="Crispy fried rolls with vegetable filling.", price=5.99, category_id=cat1.id, restaurant_id=new_resto.id)
                item2 = MenuItem(name="House Burger", description="Juicy beef patty with cheese and fresh vegetables.", price=12.99, category_id=cat2.id, restaurant_id=new_resto.id)
                item3 = MenuItem(name="Pasta Carbonara", description="Creamy pasta with bacon and parmesan.", price=15.50, category_id=cat2.id, restaurant_id=new_resto.id)
                db.session.add_all([item1, item2, item3])
        
        db.session.commit()
        print("Initial data created/updated successfully.")

if __name__ == '__main__':
    create_data()
