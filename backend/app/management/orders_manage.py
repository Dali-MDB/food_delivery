from fastapi import routing, Query, Request, Response, Depends
from app.dependencies import sessionDep
from app.authentication import oauth2_scheme, current_user
from .orders_utility import get_or_create_authenticated_order, get_user_cart
from .items_manage import fetch_item
from app.models.orders import Order, ItemOrder
from app.schemas.orders_schemas import OrderDisplay
from fastapi.exceptions import HTTPException
from typing import Annotated
from app.models.orders import order_status
from .admin_permission import verify_permission
from app.models.users import User
from datetime import datetime
from fastapi import status

order_router = routing.APIRouter(
    prefix='/orders'
)


@order_router.post('/add_to_cart/{item_id}/')
def add_to_cart(
    item_id: int, 
    quantity: int, 
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """Add item to cart - requires authentication"""
    # Get authenticated user
    user = current_user(token, db)
    
    # Get or create user's pending order (cart)
    order = get_or_create_authenticated_order(user.id, db)
    
    # Fetch the item
    item = fetch_item(item_id, db)
    
    # Check if item already exists in the order
    item_order = db.query(ItemOrder).filter(
        ItemOrder.order_id == order.id,
        ItemOrder.item_id == item_id
    ).first()
    
    if item_order:  # Already existing in the order
        item_order.quantity += quantity
        item_order.calculate_total_price()
    else:  # Create a new item order
        item_order = ItemOrder(
            quantity=quantity,
            total_price=quantity * float(item.price),
            order_id=order.id,
            item_id=item.id
        )
        db.add(item_order)

    # Commit changes to the database
    db.commit()
    db.refresh(item_order)
    
    return {
        "success": "Item added to cart successfully",
        "item_order_id": item_order.id,
        "order_id": order.id
    }


@order_router.get('/view_cart/')
def view_cart(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """View user's cart - requires authentication"""
    # Get authenticated user
    user = current_user(token, db)
    
    # Get user's pending order (cart)
    order = get_or_create_authenticated_order(user.id, db)

    items = []
    for item_order in order.item_orders:
        item = {
            "item_id": item_order.item.id,
            "item_order_id": item_order.id,
            "item_name": item_order.item.name,
            "quantity": item_order.quantity,
            "unit_price": float(item_order.item.price),
            "total_price": float(item_order.total_price)
        }
        items.append(item)
    
    return {
        'order_id': order.id,
        'item_orders': items,
        'total_price': float(order.calculate_total)
    }


@order_router.delete('/remove_from_cart/{item_order_id}/')
def remove_from_cart(
    item_order_id: int,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """Remove item from cart - requires authentication"""
    # Get authenticated user
    user = current_user(token, db)
    
    # Query the item order and verify ownership
    item_order = db.query(ItemOrder).filter(ItemOrder.id == item_order_id).first()
    if not item_order:
        raise HTTPException(status_code=404, detail="Item order not found")
    
    # Verify the item order belongs to the user's cart
    if item_order.order.user_id != user.id or item_order.order.status != order_status.PENDING:
        raise HTTPException(status_code=403, detail="You can only remove items from your own cart")
    
    db.delete(item_order)
    db.commit()
    
    return {"success": "Item removed from cart successfully"}


@order_router.put("/change_item_order_quantity/{item_order_id}")
def change_item_order_quantity(
    item_order_id: int,
    new_quantity: int,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """Change quantity of item in cart - requires authentication"""
    # Get authenticated user
    user = current_user(token, db)
    
    # Query the item order and verify ownership
    item_order = db.query(ItemOrder).filter(ItemOrder.id == item_order_id).first()
    if not item_order:
        raise HTTPException(status_code=404, detail="Item order not found")
    
    # Verify the item order belongs to the user's cart
    if item_order.order.user_id != user.id or item_order.order.status != order_status.PENDING:
        raise HTTPException(status_code=403, detail="You can only modify items in your own cart")
    
    if new_quantity <= 0:
        db.delete(item_order)
    else:
        item_order.quantity = new_quantity
        item_order.calculate_total_price()
    
    db.commit()
    return {"success": "Quantity updated successfully"}


@order_router.post('/confirm_order/')
def confirm_order(
    address: str,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """Confirm order - requires authentication"""
    # Get authenticated user
    user = current_user(token, db)
    
    # Get user's pending order (cart) - don't create if doesn't exist
    order = get_user_cart(user.id, db)
    
    if not order or not order.item_orders:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Update order details
    order.address = address
    order.status = order_status.RECEIVED
    order.ordered_at = datetime.now()
    
    db.commit()
    db.refresh(order)
    
    return {
        "message": "Order confirmed successfully",
        "order_id": order.id,
        "total_amount": float(order.calculate_total)
    }



@order_router.get('/view_orders/{user_id}/')
def view_user_orders(
    user_id: int,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """View specific user's orders - admin only or th same User"""
    user = current_user(token, db)
    # Check if user is admin or viewing their own orders
    if not user.is_admin and user.id != user_id:
        raise HTTPException(
            status_code=403, 
            detail="You can only view your own orders or admin access required"
        )
    
    # Query all orders except cart
    orders = db.query(Order).filter(
        Order.user_id == user_id,
        Order.status != order_status.PENDING
    ).order_by(Order.ordered_at.desc()).all()

    

    
    # Group orders by status
    orders_by_status = {
        order_status.RECEIVED: [],
        order_status.PREPARING: [],
        order_status.DELIVERING: [],
        order_status.DELIVERED: [],
        order_status.CANCELLED: []
    }
    
    for order in orders:
        orders_by_status[order.status].append(order)
    
    return orders_by_status


@order_router.get('/view_order/{order_id}/', response_model=OrderDisplay)
def view_order(
    order_id: int,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """View specific order details"""
    user = current_user(token, db)
    
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.status != order_status.PENDING
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Only allow if the user is the owner of the order or an admin
    if order.user_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="You are not allowed to view this order")

    
    return order


@order_router.put('/change_order_status/{order_id}/')
def change_order_status(
    order_id: int,
    new_status: order_status,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """Change order status - admin only"""
    # Check admin permission
    if new_status == order_status.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail='you can not change the status to pending')
    user = current_user(token, db)
    verify_permission(user)
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Prevent changing status of pending orders (carts)
    if order.status == order_status.PENDING:
        raise HTTPException(status_code=400, detail="Cannot change status of pending cart")
    if order.status == order_status.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot change status of cancelled cart")
    
    
    order.status = new_status
    db.commit()
    
    return {"success": "Order status updated successfully"}


@order_router.get('/view_all_orders/')
def view_all_orders(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """View all orders - admin only"""
    user = current_user(token, db)
    verify_permission(user)    
    
    orders = db.query(Order).filter(     #exclude pending orders because they are still a cart
        Order.status != order_status.PENDING
    ).order_by(Order.ordered_at.desc()).all()
    
    # Group orders by status
    orders_by_status = {
        order_status.RECEIVED: [],
        order_status.PREPARING: [],
        order_status.DELIVERING: [],
        order_status.DELIVERED: [],
        order_status.CANCELLED: []
    }
    
    for order in orders:
        orders_by_status[order.status].append(order)
    
    return orders_by_status




@order_router.post('/cancel_order/{order_id}/')
def cancel_order(
    order_id: int,
    token: Annotated[str, Depends(oauth2_scheme)],
    db: sessionDep
):
    """Cancel order (owner/admin only, cannot be pending/delivered/cancelled)"""
    user = current_user(token, db)
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    
    if order.user_id != user.id and not user.is_admin:
        raise HTTPException(403, "Permission denied")
    
    if order.status in [order_status.PENDING, order_status.DELIVERED, order_status.CANCELLED]:
        raise HTTPException(400, "Invalid order status for cancellation")
    
    order.status = order_status.CANCELLED
    db.commit()
    
    return {"success": True, "order_id": order.id}
