from app.dependencies import sessionDep
from app.models.orders import Order, order_status


def get_or_create_authenticated_order(user_id: int, db: sessionDep) -> Order:
    # Check if user already has a pending order (cart)
    cart = db.query(Order).filter(
        Order.user_id == user_id,
        Order.status == order_status.PENDING
    ).first()
    
    # If no cart exists, create a new one
    if not cart:
        cart = Order(
            user_id=user_id,
            status=order_status.PENDING,
        )
        db.add(cart)
        db.commit()
        db.refresh(cart)
    
    return cart


def get_user_cart(user_id: int, db: sessionDep) -> Order:
    return db.query(Order).filter(
        Order.user_id == user_id,
        Order.status == order_status.PENDING
    ).first()


def clear_user_cart(user_id: int, db: sessionDep) -> bool:
    cart = get_user_cart(user_id, db)
    if cart and cart.item_orders:
        # Delete all item orders in the cart
        for item_order in cart.item_orders:
            db.delete(item_order)
        db.commit()
        return True
    return False


def delete_user_cart(user_id: int, db: sessionDep) -> bool:
    cart = get_user_cart(user_id, db)
    if cart:
        db.delete(cart)
        db.commit()
        return True
    return False


def get_cart_item_count(user_id: int, db: sessionDep) -> int:
    cart = get_user_cart(user_id, db)
    if cart:
        return sum(item_order.quantity for item_order in cart.item_orders)
    return 0


def get_cart_total(user_id: int, db: sessionDep) -> float:
    cart = get_user_cart(user_id, db)
    if cart:
        return float(cart.calculate_total)
    return 0.0

