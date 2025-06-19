# FoodExpress Frontend

A beautiful and modern food delivery web application with vibrant, appetite-stimulating colors.

## Features

- 🍕 **Beautiful UI**: Modern design with vibrant food-appetizing colors
- 🔐 **Authentication**: Login and signup functionality
- 📱 **Responsive Design**: Works perfectly on all devices
- 🛒 **Shopping Cart**: Add items with quantity control
- 💳 **Checkout System**: Complete order placement
- ⭐ **Reviews Display**: Show customer reviews
- 🎯 **Category Browsing**: Browse items by categories

## Color Scheme

The app uses a carefully selected color palette that stimulates appetite:
- **Primary**: Orange (#ff6b35) - Appetizing and energetic
- **Secondary**: Warm Orange (#f7931e) - Food-friendly
- **Accent**: Yellow (#ffd23f) - Cheerful and inviting
- **Success**: Green (#4caf50) - Fresh and healthy
- **Background**: Warm cream (#fff9f0) - Comforting

## File Structure

```
frontend/
├── html/
│   └── index.html          # Main HTML file
├── css/
│   └── styles.css          # Complete styling
├── js/
│   └── app.js             # All JavaScript functionality
└── README.md              # This file
```

## How to Run

### Prerequisites

1. Make sure your FastAPI backend is running on `http://localhost:8000`
2. Ensure you have some categories and items in your database

### Running the Frontend

1. **Simple Method**: Open `frontend/html/index.html` in your web browser
2. **Local Server Method** (Recommended):
   ```bash
   # Navigate to the frontend directory
   cd frontend
   
   # Start a simple HTTP server
   python -m http.server 8080
   
   # Or using Node.js
   npx http-server -p 8080
   
   # Then open http://localhost:8080/html/index.html
   ```

### Backend Setup

Make sure your FastAPI backend is running:

```bash
cd backend
uvicorn main:app --reload
```

## API Integration

The frontend integrates with your FastAPI backend using these endpoints:

### Authentication
- `POST /auth/login/` - User login
- `POST /auth/register/` - User registration
- `GET /auth/current_user/` - Get current user info

### Categories
- `GET /category/all/` - Get all categories
- `GET /category/{id}/all_items/` - Get items by category

### Orders & Cart
- `POST /orders/add_to_cart/{item_id}/` - Add item to cart
- `GET /orders/view_cart/` - View cart contents
- `DELETE /orders/remove_from_cart/{item_order_id}/` - Remove from cart
- `POST /orders/confirm_order/` - Place order

### Reviews
- `GET /reviews/general/` - Get general reviews

## Features in Detail

### 1. Navigation
- Fixed navbar with logo and menu items
- Authentication buttons (Login/Signup or Logout/Profile)
- Shopping cart with item count
- Responsive hamburger menu for mobile

### 2. Hero Section
- Eye-catching hero with animated food icons
- Call-to-action buttons
- Gradient background with warm colors

### 3. Categories Section
- Grid layout of category cards
- Each card has an icon, title, and description
- Click to view items in that category
- Hover effects and animations

### 4. Items Modal
- Displays items from selected category
- Each item shows name, description, and price
- Quantity controls for adding to cart
- "Add to Cart" button (requires authentication)

### 5. Shopping Cart
- Modal-based cart interface
- Shows all items with quantities and prices
- Remove items functionality
- Clear cart option
- Checkout button

### 6. Checkout Process
- Delivery address input
- Order summary display
- Total price calculation
- Order confirmation

### 7. Reviews Section
- Displays customer reviews
- Star ratings
- User avatars
- Responsive grid layout

### 8. Authentication
- Modal-based login and signup forms
- Form validation
- Error handling
- Automatic token management
- Persistent login state

## User Experience

### For Unauthenticated Users
- Can browse categories and items
- Can view reviews
- Must login to add items to cart
- Smooth authentication flow

### For Authenticated Users
- Full access to all features
- Shopping cart functionality
- Order placement
- Persistent cart across sessions

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend is running on `http://localhost:8000`
   - Check CORS settings in backend
   - Verify API endpoints are working

2. **Authentication Issues**
   - Clear browser localStorage
   - Check if JWT token is valid
   - Ensure backend authentication is working

3. **Cart Not Loading**
   - Make sure user is authenticated
   - Check browser console for errors
   - Verify cart endpoints are working

### Debug Mode

Open browser developer tools (F12) to see:
- Console logs for debugging
- Network requests to API
- Any JavaScript errors

## Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #ff6b35;
    --secondary-color: #f7931e;
    --accent-color: #ffd23f;
    /* ... other colors */
}
```

### API Base URL
Change the API base URL in `app.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

## Performance

- Optimized CSS with efficient selectors
- Minimal JavaScript with async/await
- Lazy loading of content
- Efficient DOM manipulation
- Responsive images and icons

## Security

- JWT token authentication
- Secure API communication
- Input validation
- XSS protection
- CSRF protection (handled by backend)

## Future Enhancements

Potential improvements:
- Real-time order tracking
- Payment integration
- User profile management
- Order history
- Favorites/wishlist
- Search functionality
- Filtering and sorting
- Push notifications

---

**Enjoy your food delivery experience! 🍕🍔🍦☕** 