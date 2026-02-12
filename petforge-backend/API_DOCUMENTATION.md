# PetForge Backend API Documentation

## Base URL
```
http://localhost:4000
```

## Authentication

All API endpoints (except `/api/auth/register` and `/api/auth/login`) require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Auth Endpoints

### 1. Register User
**POST** `/api/auth/register`

Register a new user account. New users receive 100 initial credits.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null,
      "credits": 100
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- `email`: Must be a valid email address
- `password`: Minimum 6 characters
- `name`: Optional

---

### 2. Login
**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": null,
      "credits": 100
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Get Current User
**GET** `/api/auth/me`

Get the currently authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "credits": 85,
    "createdAt": "2025-02-11T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: No token provided
- `401`: Token expired
- `403`: Invalid token
- `404`: User not found

---

## Cart Endpoints

All cart endpoints require authentication.

### 1. Get Cart
**GET** `/api/cart`

Get all items in the user's cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "petIpId": "clx...",
      "productType": "3D Model",
      "productName": "Custom Pet Model",
      "price": 29.99,
      "size": "Medium",
      "baseStyle": "Realistic",
      "quantity": 2,
      "createdAt": "2025-02-11T10:00:00.000Z",
      "petIp": {
        "id": "clx...",
        "name": "Fluffy",
        "style": "Realistic",
        "rarity": "Common"
      }
    }
  ]
}
```

---

### 2. Add to Cart
**POST** `/api/cart`

Add an item to the cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "petIpId": "clx...",
  "productType": "3D Model",
  "productName": "Custom Pet Model",
  "price": 29.99,
  "size": "Medium",
  "baseStyle": "Realistic",
  "quantity": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "userId": "clx...",
    "petIpId": "clx...",
    "productType": "3D Model",
    "productName": "Custom Pet Model",
    "price": 29.99,
    "size": "Medium",
    "baseStyle": "Realistic",
    "quantity": 1,
    "createdAt": "2025-02-11T10:00:00.000Z"
  }
}
```

**Validation Rules:**
- `productType`: Required, string
- `productName`: Required, string
- `price`: Required, positive number
- `size`: Optional, string
- `baseStyle`: Optional, string
- `quantity`: Optional, integer >= 1, default: 1

---

### 3. Remove from Cart
**DELETE** `/api/cart?id=<cart_item_id>`

Remove an item from the cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `id` (required): Cart item ID

**Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### 4. Update Cart Item Quantity
**PATCH** `/api/cart/<cart_item_id>`

Update the quantity of an item in the cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "quantity": 3,
    ...
  }
}
```

---

### 5. Clear Cart
**POST** `/api/cart/clear`

Remove all items from the cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared successfully"
}
```

---

## Order Endpoints

All order endpoints require authentication.

### 1. Get User's Orders
**GET** `/api/orders`

Get all orders for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "userId": "clx...",
      "orderNumber": "PF250211123456",
      "totalAmount": 59.98,
      "receiverName": "John Doe",
      "receiverPhone": "+1234567890",
      "receiverAddress": "123 Main St, City, Country",
      "paymentMethod": "wechat",
      "status": "pending",
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:00:00.000Z",
      "items": [
        {
          "id": "clx...",
          "orderId": "clx...",
          "productType": "3D Model",
          "productName": "Custom Pet Model",
          "price": 29.99,
          "quantity": 2,
          "specifications": "{\"size\":\"Medium\",\"baseStyle\":\"Realistic\"}"
        }
      ]
    }
  ]
}
```

---

### 2. Get Single Order
**GET** `/api/orders/<order_id>`

Get details of a specific order.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "userId": "clx...",
    "orderNumber": "PF250211123456",
    "totalAmount": 59.98,
    "receiverName": "John Doe",
    "receiverPhone": "+1234567890",
    "receiverAddress": "123 Main St, City, Country",
    "paymentMethod": "wechat",
    "status": "pending",
    "createdAt": "2025-02-11T10:00:00.000Z",
    "updatedAt": "2025-02-11T10:00:00.000Z",
    "items": [...],
    "user": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

**Error Responses:**
- `403`: Access denied (order doesn't belong to user)
- `404`: Order not found

---

### 3. Create Order
**POST** `/api/orders`

Create a new order from items in the cart.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "receiverName": "John Doe",
  "receiverPhone": "+1234567890",
  "receiverAddress": "123 Main St, City, Country",
  "paymentMethod": "wechat",
  "useCredits": true,
  "creditsToUse": 50
}
```

**Parameters:**
- `receiverName` (required): Recipient's name
- `receiverPhone` (required): Recipient's phone number
- `receiverAddress` (required): Delivery address
- `paymentMethod` (required): Payment method - "wechat", "alipay", or "card"
- `useCredits` (optional): Whether to use credits for discount (default: false)
- `creditsToUse` (optional): Specific amount of credits to use (if not provided, uses all available credits)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "userId": "clx...",
    "orderNumber": "PF250211123456",
    "totalAmount": 54.98,
    "receiverName": "John Doe",
    "receiverPhone": "+1234567890",
    "receiverAddress": "123 Main St, City, Country",
    "paymentMethod": "wechat",
    "status": "pending",
    "createdAt": "2025-02-11T10:00:00.000Z",
    "updatedAt": "2025-02-11T10:00:00.000Z",
    "items": [
      {
        "id": "clx...",
        "orderId": "clx...",
        "productType": "3D Model",
        "productName": "Custom Pet Model",
        "price": 29.99,
        "quantity": 2,
        "specifications": "{\"size\":\"Medium\",\"baseStyle\":\"Realistic\",\"petIpId\":\"clx...\"}"
      }
    ],
    "orderSummary": {
      "originalAmount": 59.98,
      "creditsDiscount": 5.0,
      "creditsUsed": 500,
      "finalAmount": 54.98
    }
  }
}
```

**How it works:**
1. Retrieves all items from the user's cart
2. Validates cart is not empty
3. If `useCredits` is true, calculates discount (1 credit = 0.01 currency)
4. Generates unique order number (format: PF + YYMMDD + random 6 digits)
5. Creates order with items in a database transaction
6. Clears the cart
7. Updates user credits if used

**Error Responses:**
- `400`: Cart is empty
- `400`: Validation errors (missing required fields)
- `404`: User not found
- `500`: Failed to generate unique order number

---

### 4. Update Order Status
**PATCH** `/api/orders/<order_id>`

Update the status of an order.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "processing"
}
```

**Valid Status Values:**
- `pending`: Order placed, awaiting processing
- `processing`: Order is being processed
- `shipped`: Order has been shipped
- `delivered`: Order has been delivered
- `cancelled`: Order has been cancelled

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "status": "processing",
    ...
  }
}
```

**Error Responses:**
- `400`: Invalid status value
- `403`: Access denied (order doesn't belong to user)
- `404`: Order not found

---

## Order Number Format

Order numbers follow this pattern: `PF + YYMMDD + random_6_digits`

Example: `PF250211123456`

- `PF`: Fixed prefix for PetForge
- `250211`: Date (YYMMDD format) - February 11, 2025
- `123456`: Random 6-digit number

---

## Credits System

- New users receive **100 initial credits** upon registration
- Credits can be used to discount orders
- Exchange rate: **1 credit = 0.01 currency unit**
- Credits are deducted from the user's balance when used
- Maximum discount: Cannot exceed total order amount

---

## Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": "Error message here"
}
```

For validation errors (ZodError):
```json
{
  "success": false,
  "error": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["receiverName"],
      "message": "Receiver name is required"
    }
  ]
}
```

---

## HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors, missing data)
- `401`: Unauthorized (no token, expired token)
- `403`: Forbidden (invalid token, access denied)
- `404`: Not Found
- `500`: Internal Server Error

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}"
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### Create Order (replace TOKEN with your JWT)
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d "{\"receiverName\":\"John Doe\",\"receiverPhone\":\"+1234567890\",\"receiverAddress\":\"123 Main St\",\"paymentMethod\":\"wechat\",\"useCredits\":true}"
```

---

## Security Notes

1. **JWT Token Storage**: Store tokens securely on the client side (e.g., httpOnly cookies or secure localStorage)
2. **Token Expiration**: Default token expiration is 7 days (configurable via JWT_EXPIRES_IN env variable)
3. **Password Encryption**: All passwords are hashed using bcrypt with salt rounds of 10
4. **User Verification**: All operations verify user identity from JWT token
5. **Access Control**: Users can only access their own data (orders, cart items)
6. **Input Validation**: All inputs are validated using Zod schemas

---

## Environment Variables

Required environment variables in `.env`:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=4000
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

---

## Database Schema

### User Model
- `id`: CUID (primary key)
- `email`: String (unique)
- `password`: String (hashed, nullable)
- `name`: String (nullable)
- `avatar`: String (nullable)
- `credits`: Int (default: 100)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Order Model
- `id`: CUID (primary key)
- `userId`: String (foreign key)
- `orderNumber`: String (unique)
- `totalAmount`: Float
- `receiverName`: String
- `receiverPhone`: String
- `receiverAddress`: String
- `paymentMethod`: String
- `status`: String (default: "pending")
- `createdAt`: DateTime
- `updatedAt`: DateTime

### OrderItem Model
- `id`: CUID (primary key)
- `orderId`: String (foreign key)
- `productType`: String
- `productName`: String
- `price`: Float
- `quantity`: Int
- `specifications`: String (JSON)

### CartItem Model
- `id`: CUID (primary key)
- `userId`: String (foreign key)
- `petIpId`: String (nullable, foreign key)
- `productType`: String
- `productName`: String
- `price`: Float
- `size`: String (nullable)
- `baseStyle`: String (nullable)
- `quantity`: Int (default: 1)
- `createdAt`: DateTime
