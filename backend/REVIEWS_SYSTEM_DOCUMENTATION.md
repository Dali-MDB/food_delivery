# Reviews System Documentation
## For Frontend Team

### Table of Contents
1. [System Overview](#system-overview)
2. [Review Types](#review-types)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Data Models](#data-models)
6. [Business Rules](#business-rules)
7. [Implementation Phases](#implementation-phases)
8. [Error Handling](#error-handling)
9. [Frontend Integration Guide](#frontend-integration-guide)

---

## System Overview

The reviews system allows users to provide feedback in three different contexts:
- **General Reviews**: Overall service feedback
- **Order Reviews**: Feedback for specific delivered orders
- **Item Reviews**: Product-specific feedback

### Key Features
- ✅ User authentication required for all review operations
- ✅ Users can only edit/delete their own reviews
- ✅ Order reviews only allowed for delivered orders owned by the user
- ✅ Item reviews available for all users
- ✅ Admin can manage all reviews
- ✅ Pagination support for all listing endpoints
- ✅ Rating system (1-5 stars)

---

## Review Types

### 1. General Reviews
- **Purpose**: Overall service feedback
- **Who can create**: Any authenticated user
- **Who can edit/delete**: Review owner only
- **Limitations**: None

### 2. Order Reviews
- **Purpose**: Feedback for specific orders
- **Who can create**: Order owner only
- **Prerequisites**: Order must be delivered
- **Limitations**: One review per order
- **Who can edit/delete**: Review owner only

### 3. Item Reviews
- **Purpose**: Product-specific feedback
- **Who can create**: Any authenticated user
- **Prerequisites**: Item must exist
- **Limitations**: None
- **Who can edit/delete**: Review owner only

---

## API Endpoints

### Base URL
```
/reviews
```

### General Reviews
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/general/` | Create general review | ✅ |
| GET | `/general/` | List general reviews | ❌ |
| GET | `/general/{id}` | Get specific review | ❌ |
| PUT | `/general/{id}` | Update review | ✅ |
| DELETE | `/general/{id}` | Delete review | ✅ |

### Order Reviews
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders/` | Create order review | ✅ |
| GET | `/orders/` | List order reviews | ❌ |
| GET | `/orders/{id}` | Get specific review | ❌ |
| GET | `/orders/order/{order_id}` | Get review by order | ❌ |
| PUT | `/orders/{id}` | Update review | ✅ |
| DELETE | `/orders/{id}` | Delete review | ✅ |

### Item Reviews
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/items/` | Create item review | ✅ |
| GET | `/items/` | List item reviews | ❌ |
| GET | `/items/{id}` | Get specific review | ❌ |
| GET | `/items/item/{item_id}` | Get reviews by item | ❌ |
| PUT | `/items/{id}` | Update review | ✅ |
| DELETE | `/items/{id}` | Delete review | ✅ |

### User Reviews
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/my-reviews/` | Get user's reviews | ✅ |

### Admin Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/all/` | Get all reviews | ✅ (Admin) |
| DELETE | `/admin/{id}` | Delete any review | ✅ (Admin) |

---

## Authentication & Authorization

### Authentication
- All endpoints require Bearer token authentication
- Token obtained via `/auth/login/` endpoint
- Include in headers: `Authorization: Bearer <token>`

### Authorization Rules
1. **Create Reviews**: Authenticated users only
2. **Read Reviews**: Public (no auth required)
3. **Update/Delete**: Review owner only
4. **Order Reviews**: Order owner + delivered status required
5. **Admin Operations**: Admin users only

---

## Data Models

### Review Base Schema
```json
{
  "content": "string (1-1000 chars)",
  "rating": "integer (1-5)"
}
```

### Review Display Schema
```json
{
  "id": "integer",
  "user_id": "integer",
  "content": "string",
  "rating": "integer",
  "type": "enum (general|order_review|item_review)"
}
```

### Order Review Create Schema
```json
{
  "content": "string",
  "rating": "integer",
  "order_id": "integer"
}
```

### Item Review Create Schema
```json
{
  "content": "string",
  "rating": "integer",
  "item_id": "integer"
}
```

### Review Update Schema
```json
{
  "content": "string (optional)",
  "rating": "integer (optional)"
}
```

### Pagination Response
```json
{
  "reviews": "array of ReviewDisplay",
  "total": "integer",
  "page": "integer",
  "per_page": "integer"
}
```

---

## Business Rules

### General Rules
1. **Content Validation**: 1-1000 characters
2. **Rating Validation**: 1-5 stars
3. **Ownership**: Users can only modify their own reviews
4. **Authentication**: Required for all write operations

### Order Review Rules
1. **Order Status**: Must be DELIVERED
2. **Ownership**: User must own the order
3. **Uniqueness**: One review per order
4. **Timing**: Can only review after delivery

### Item Review Rules
1. **Item Existence**: Item must exist in database
2. **No Duplicates**: Multiple reviews per item allowed
3. **Public Access**: Anyone can read item reviews

### Admin Rules
1. **Admin Access**: Only admin users can access admin endpoints
2. **Full Control**: Admins can delete any review
3. **Monitoring**: Admins can view all reviews

---

## Implementation Phases

### Phase 1: Core Infrastructure ✅
- [x] Database models (Review, OrderReview, ItemReview)
- [x] Pydantic schemas
- [x] Basic CRUD operations
- [x] Authentication integration

### Phase 2: Business Logic ✅
- [x] Order ownership validation
- [x] Order status validation (DELIVERED only)
- [x] Review ownership validation
- [x] Item existence validation

### Phase 3: API Endpoints ✅
- [x] General review endpoints
- [x] Order review endpoints
- [x] Item review endpoints
- [x] User review endpoints
- [x] Admin endpoints

### Phase 4: Advanced Features ✅
- [x] Pagination support
- [x] Error handling
- [x] Input validation
- [x] Response formatting

### Phase 5: Frontend Integration (Next)
- [ ] Frontend components
- [ ] Review forms
- [ ] Review display components
- [ ] Rating system UI
- [ ] Pagination UI

---

## Error Handling

### Common HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Review created successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate review (order reviews)

### Error Response Format
```json
{
  "detail": "Error message description"
}
```

### Common Error Messages
- "Order not found, not delivered, or doesn't belong to you"
- "Order already has a review"
- "Item not found"
- "Review not found or doesn't belong to you"
- "Admin access required"
- "This is not a [review_type] review"

---

## Frontend Integration Guide

### 1. Authentication Setup
```javascript
// Include token in all API calls
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### 2. Create Review Forms
```javascript
// General Review
const createGeneralReview = async (data) => {
  const response = await fetch('/reviews/general/', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return response.json();
};

// Order Review
const createOrderReview = async (data) => {
  const response = await fetch('/reviews/orders/', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return response.json();
};

// Item Review
const createItemReview = async (data) => {
  const response = await fetch('/reviews/items/', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 3. Fetch Reviews with Pagination
```javascript
const getReviews = async (type, page = 1, perPage = 10) => {
  const response = await fetch(
    `/reviews/${type}/?page=${page}&per_page=${perPage}`
  );
  return response.json();
};
```

### 4. Update Review
```javascript
const updateReview = async (type, reviewId, data) => {
  const response = await fetch(`/reviews/${type}/${reviewId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### 5. Delete Review
```javascript
const deleteReview = async (type, reviewId) => {
  const response = await fetch(`/reviews/${type}/${reviewId}`, {
    method: 'DELETE',
    headers
  });
  return response.json();
};
```

### 6. User Reviews
```javascript
const getUserReviews = async (page = 1, perPage = 10) => {
  const response = await fetch(
    `/reviews/my-reviews/?page=${page}&per_page=${perPage}`,
    { headers }
  );
  return response.json();
};
```

### 7. Rating Component Example
```javascript
const RatingComponent = ({ rating, onRatingChange, readonly = false }) => {
  const stars = [1, 2, 3, 4, 5];
  
  return (
    <div className="rating">
      {stars.map(star => (
        <button
          key={star}
          onClick={() => !readonly && onRatingChange(star)}
          className={`star ${star <= rating ? 'filled' : ''}`}
          disabled={readonly}
        >
          ★
        </button>
      ))}
    </div>
  );
};
```

### 8. Review Form Example
```javascript
const ReviewForm = ({ type, onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    content: initialData.content || '',
    rating: initialData.rating || 5,
    ...(type === 'order' && { order_id: initialData.order_id }),
    ...(type === 'item' && { item_id: initialData.item_id })
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Review submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={formData.content}
        onChange={(e) => setFormData({...formData, content: e.target.value})}
        placeholder="Write your review..."
        minLength={1}
        maxLength={1000}
        required
      />
      <RatingComponent
        rating={formData.rating}
        onRatingChange={(rating) => setFormData({...formData, rating})}
      />
      <button type="submit">Submit Review</button>
    </form>
  );
};
```

---

## Testing Checklist

### Frontend Testing
- [ ] Authentication flow
- [ ] Review creation forms
- [ ] Review display components
- [ ] Rating system
- [ ] Pagination
- [ ] Error handling
- [ ] Loading states
- [ ] Form validation
- [ ] Responsive design

### Integration Testing
- [ ] API endpoint connectivity
- [ ] Data flow between frontend and backend
- [ ] Error message display
- [ ] Authentication token handling
- [ ] Real-time updates

---

## Support & Contact

For technical questions or issues:
- Backend API: Check the FastAPI documentation at `/docs`
- Database Schema: Refer to the models in `app/models/reviews.py`
- Business Logic: Check the management file in `app/management/reviews_management.py`

---

*This documentation was generated for the frontend team to understand and implement the reviews system integration.* 