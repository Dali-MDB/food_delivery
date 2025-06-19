# API Specification
## Reviews System

### Base URL
```
http://localhost:8000
```

### Authentication
All protected endpoints require Bearer token authentication:
```
Authorization: Bearer <your_jwt_token>
```

---

## General Reviews

### Create General Review
**POST** `/reviews/general/`

**Description**: Create a new general review

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Great service overall!",
  "rating": 5
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "user_id": 123,
  "content": "Great service overall!",
  "rating": 5,
  "type": "general"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required

---

### Get General Reviews
**GET** `/reviews/general/`

**Description**: Get paginated list of general reviews

**Authentication**: Not required

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 10, max: 100)

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": 1,
      "user_id": 123,
      "content": "Great service overall!",
      "rating": 5,
      "type": "general"
    }
  ],
  "total": 25,
  "page": 1,
  "per_page": 10
}
```

---

### Get Specific General Review
**GET** `/reviews/general/{review_id}`

**Description**: Get a specific general review

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 123,
  "content": "Great service overall!",
  "rating": 5,
  "type": "general"
}
```

**Error Responses**:
- `404 Not Found`: Review not found

---

### Update General Review
**PUT** `/reviews/general/{review_id}`

**Description**: Update a general review (owner only)

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Updated review content",
  "rating": 4
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "user_id": 123,
  "content": "Updated review content",
  "rating": 4,
  "type": "general"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input or wrong review type
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Review not found or doesn't belong to user

---

### Delete General Review
**DELETE** `/reviews/general/{review_id}`

**Description**: Delete a general review (owner only)

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "General review deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Review not found or doesn't belong to user

---

## Order Reviews

### Create Order Review
**POST** `/reviews/orders/`

**Description**: Create a review for a delivered order (order owner only)

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Fast delivery and great food!",
  "rating": 5,
  "order_id": 456
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "user_id": 123,
  "content": "Fast delivery and great food!",
  "rating": 5,
  "type": "order_review",
  "order_id": 456
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Order not found, not delivered, or doesn't belong to user
- `409 Conflict`: Order already has a review

---

### Get Order Reviews
**GET** `/reviews/orders/`

**Description**: Get paginated list of order reviews

**Authentication**: Not required

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 10, max: 100)

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": 2,
      "user_id": 123,
      "content": "Fast delivery and great food!",
      "rating": 5,
      "type": "order_review",
      "order_id": 456
    }
  ],
  "total": 15,
  "page": 1,
  "per_page": 10
}
```

---

### Get Order Review by Order
**GET** `/reviews/orders/order/{order_id}`

**Description**: Get review for a specific order

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "id": 2,
  "user_id": 123,
  "content": "Fast delivery and great food!",
  "rating": 5,
  "type": "order_review",
  "order_id": 456
}
```

**Error Responses**:
- `404 Not Found`: No review found for this order

---

### Update Order Review
**PUT** `/reviews/orders/{review_id}`

**Description**: Update an order review (owner only)

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Updated order review",
  "rating": 4
}
```

**Response** (200 OK):
```json
{
  "id": 2,
  "user_id": 123,
  "content": "Updated order review",
  "rating": 4,
  "type": "order_review",
  "order_id": 456
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input or wrong review type
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Review not found or doesn't belong to user

---

### Delete Order Review
**DELETE** `/reviews/orders/{review_id}`

**Description**: Delete an order review (owner only)

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Order review deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Review not found or doesn't belong to user

---

## Item Reviews

### Create Item Review
**POST** `/reviews/items/`

**Description**: Create a review for an item

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Delicious pizza!",
  "rating": 5,
  "item_id": 789
}
```

**Response** (201 Created):
```json
{
  "id": 3,
  "user_id": 123,
  "content": "Delicious pizza!",
  "rating": 5,
  "type": "item_review",
  "item_id": 789
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Item not found

---

### Get Item Reviews
**GET** `/reviews/items/`

**Description**: Get paginated list of item reviews

**Authentication**: Not required

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 10, max: 100)
- `item_id` (integer, optional): Filter by item ID

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": 3,
      "user_id": 123,
      "content": "Delicious pizza!",
      "rating": 5,
      "type": "item_review",
      "item_id": 789
    }
  ],
  "total": 30,
  "page": 1,
  "per_page": 10
}
```

---

### Get Item Reviews by Item
**GET** `/reviews/items/item/{item_id}`

**Description**: Get all reviews for a specific item

**Authentication**: Not required

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 10, max: 100)

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": 3,
      "user_id": 123,
      "content": "Delicious pizza!",
      "rating": 5,
      "type": "item_review",
      "item_id": 789
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 10
}
```

**Error Responses**:
- `404 Not Found`: Item not found

---

### Update Item Review
**PUT** `/reviews/items/{review_id}`

**Description**: Update an item review (owner only)

**Authentication**: Required

**Request Body**:
```json
{
  "content": "Updated item review",
  "rating": 4
}
```

**Response** (200 OK):
```json
{
  "id": 3,
  "user_id": 123,
  "content": "Updated item review",
  "rating": 4,
  "type": "item_review",
  "item_id": 789
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input or wrong review type
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Review not found or doesn't belong to user

---

### Delete Item Review
**DELETE** `/reviews/items/{review_id}`

**Description**: Delete an item review (owner only)

**Authentication**: Required

**Response** (200 OK):
```json
{
  "message": "Item review deleted successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Review not found or doesn't belong to user

---

## User Reviews

### Get User's Reviews
**GET** `/reviews/my-reviews/`

**Description**: Get all reviews by the current user

**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 10, max: 100)

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": 1,
      "user_id": 123,
      "content": "Great service overall!",
      "rating": 5,
      "type": "general"
    },
    {
      "id": 2,
      "user_id": 123,
      "content": "Fast delivery and great food!",
      "rating": 5,
      "type": "order_review",
      "order_id": 456
    }
  ],
  "total": 2,
  "page": 1,
  "per_page": 10
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required

---

## Admin Endpoints

### Get All Reviews (Admin)
**GET** `/reviews/admin/all/`

**Description**: Get all reviews (admin only)

**Authentication**: Required (Admin)

**Query Parameters**:
- `page` (integer, optional): Page number (default: 1)
- `per_page` (integer, optional): Items per page (default: 10, max: 100)
- `review_type` (string, optional): Filter by review type

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": 1,
      "user_id": 123,
      "content": "Great service overall!",
      "rating": 5,
      "type": "general"
    }
  ],
  "total": 50,
  "page": 1,
  "per_page": 10
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Admin access required

---

### Delete Any Review (Admin)
**DELETE** `/reviews/admin/{review_id}`

**Description**: Delete any review (admin only)

**Authentication**: Required (Admin)

**Response** (200 OK):
```json
{
  "message": "Review deleted successfully by admin"
}
```

**Error Responses**:
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Admin access required
- `404 Not Found`: Review not found

---

## Data Models

### Review Base
```json
{
  "content": "string (1-1000 characters)",
  "rating": "integer (1-5)"
}
```

### Review Display
```json
{
  "id": "integer",
  "user_id": "integer",
  "content": "string",
  "rating": "integer",
  "type": "enum (general|order_review|item_review)"
}
```

### Order Review Display
```json
{
  "id": "integer",
  "user_id": "integer",
  "content": "string",
  "rating": "integer",
  "type": "order_review",
  "order_id": "integer"
}
```

### Item Review Display
```json
{
  "id": "integer",
  "user_id": "integer",
  "content": "string",
  "rating": "integer",
  "type": "item_review",
  "item_id": "integer"
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

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Success |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource (order reviews) |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## Versioning

This API is version 1.0. Future versions will be available at `/api/v2/` etc.

---

*This specification documents all available endpoints for the reviews system.* 