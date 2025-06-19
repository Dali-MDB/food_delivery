from app.database import session_local
from app.models.items import Category, Item
from app.models.reviews import Review
from app.models.users import User
from app.hashing import hash_password
from sqlalchemy.orm import Session

def create_sample_data():
    db = session_local()
    
    try:
        # Create sample categories
        categories_data = [
            {"name": "Pizza"},
            {"name": "Burgers"},
            {"name": "Desserts"},
            {"name": "Beverages"},
            {"name": "Pasta"},
            {"name": "Salads"}
        ]
        
        categories = []
        for cat_data in categories_data:
            category = Category(**cat_data)
            db.add(category)
            categories.append(category)
        
        db.commit()
        
        # Create sample items
        items_data = [
            {"name": "Margherita Pizza", "description": "Classic tomato sauce with mozzarella cheese", "price": 12.99, "category_id": 1},
            {"name": "Pepperoni Pizza", "description": "Spicy pepperoni with melted cheese", "price": 14.99, "category_id": 1},
            {"name": "BBQ Chicken Pizza", "description": "BBQ sauce with grilled chicken and onions", "price": 16.99, "category_id": 1},
            {"name": "Classic Burger", "description": "Beef patty with lettuce, tomato, and cheese", "price": 9.99, "category_id": 2},
            {"name": "Bacon Cheeseburger", "description": "Beef patty with bacon and cheddar cheese", "price": 11.99, "category_id": 2},
            {"name": "Veggie Burger", "description": "Plant-based patty with fresh vegetables", "price": 10.99, "category_id": 2},
            {"name": "Chocolate Cake", "description": "Rich chocolate cake with chocolate frosting", "price": 6.99, "category_id": 3},
            {"name": "Ice Cream Sundae", "description": "Vanilla ice cream with hot fudge and nuts", "price": 5.99, "category_id": 3},
            {"name": "Tiramisu", "description": "Italian dessert with coffee and mascarpone", "price": 7.99, "category_id": 3},
            {"name": "Coffee", "description": "Fresh brewed coffee", "price": 3.99, "category_id": 4},
            {"name": "Smoothie", "description": "Fresh fruit smoothie", "price": 4.99, "category_id": 4},
            {"name": "Lemonade", "description": "Fresh squeezed lemonade", "price": 3.49, "category_id": 4},
            {"name": "Spaghetti Carbonara", "description": "Pasta with eggs, cheese, and pancetta", "price": 13.99, "category_id": 5},
            {"name": "Fettuccine Alfredo", "description": "Pasta with creamy alfredo sauce", "price": 12.99, "category_id": 5},
            {"name": "Caesar Salad", "description": "Fresh romaine lettuce with caesar dressing", "price": 8.99, "category_id": 6},
            {"name": "Greek Salad", "description": "Mixed greens with feta cheese and olives", "price": 9.99, "category_id": 6}
        ]
        
        for item_data in items_data:
            item = Item(**item_data)
            db.add(item)
        
        # Create sample user
        sample_user = User(
            username="testuser",
            email="test@example.com",
            phone="1234567890",
            password=hash_password("password123"),
            is_admin=False
        )
        db.add(sample_user)
        
        # Create sample reviews
        reviews_data = [
            {"content": "Amazing food and fast delivery! Highly recommend.", "rating": 5, "user_id": 1, "type": "general"},
            {"content": "The pizza was delicious and arrived hot. Great service!", "rating": 5, "user_id": 1, "type": "general"},
            {"content": "Best burgers in town! Will definitely order again.", "rating": 4, "user_id": 1, "type": "general"},
            {"content": "The desserts are to die for! Especially the chocolate cake.", "rating": 5, "user_id": 1, "type": "general"},
            {"content": "Good food but delivery was a bit slow.", "rating": 3, "user_id": 1, "type": "general"}
        ]
        
        for review_data in reviews_data:
            review = Review(**review_data)
            db.add(review)
        
        db.commit()
        print("✅ Sample data created successfully!")
        print(f"📊 Created {len(categories)} categories")
        print(f"🍕 Created {len(items_data)} items")
        print(f"👤 Created 1 sample user (test@example.com / password123)")
        print(f"⭐ Created {len(reviews_data)} reviews")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data() 