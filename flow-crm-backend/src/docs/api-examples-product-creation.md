# Product Creation API Examples

This document provides examples of the Product Creation API, demonstrating the automatic code generation feature.

## Automatic Code Generation

When creating products, the `code` field is now **optional**. If not provided, the system will automatically generate a unique code following the pattern `PROD` + 7-digit zero-padded sequence.

### Example 1: Create Product Without Code (Automatic Generation)

**Request:**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Wireless Bluetooth Headphones",
  "unit": "piece",
  "description": "High-quality wireless headphones with noise cancellation",
  "stock": 50,
  "purchasePrice": "75.00",
  "salePrice": "120.00",
  "saleType": "retail"
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "PROD0000001",
    "name": "Wireless Bluetooth Headphones",
    "unit": "piece",
    "description": "High-quality wireless headphones with noise cancellation",
    "stock": 50,
    "purchasePrice": "75.00",
    "salePrice": "120.00",
    "saleType": "retail",
    "createdAt": "2025-01-10T08:52:42.123Z",
    "updatedAt": "2025-01-10T08:52:42.123Z"
  },
  "message": "Product created successfully",
  "timestamp": "2025-01-10T08:52:42.123Z"
}
```

### Example 2: Sequential Code Generation

**First Product Request:**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Gaming Mouse",
  "unit": "piece",
  "purchasePrice": "25.00",
  "salePrice": "45.00",
  "saleType": "retail"
}
```

**First Product Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "code": "PROD0000002",
    "name": "Gaming Mouse",
    "unit": "piece",
    "description": null,
    "stock": 0,
    "purchasePrice": "25.00",
    "salePrice": "45.00",
    "saleType": "retail",
    "createdAt": "2025-01-10T08:53:15.456Z",
    "updatedAt": "2025-01-10T08:53:15.456Z"
  },
  "message": "Product created successfully",
  "timestamp": "2025-01-10T08:53:15.456Z"
}
```

**Second Product Request:**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mechanical Keyboard",
  "unit": "piece",
  "purchasePrice": "80.00",
  "salePrice": "130.00",
  "saleType": "retail"
}
```

**Second Product Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "code": "PROD0000003",
    "name": "Mechanical Keyboard",
    "unit": "piece",
    "description": null,
    "stock": 0,
    "purchasePrice": "80.00",
    "salePrice": "130.00",
    "saleType": "retail",
    "createdAt": "2025-01-10T08:54:22.789Z",
    "updatedAt": "2025-01-10T08:54:22.789Z"
  },
  "message": "Product created successfully",
  "timestamp": "2025-01-10T08:54:22.789Z"
}
```

## Backward Compatibility

### Manual Code Provision (Legacy Support)

The API still supports manual code provision for backward compatibility, though the provided code will be ignored in favor of automatic generation.

**Request with Manual Code:**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "CUSTOM001",
  "name": "Custom Product",
  "unit": "piece",
  "purchasePrice": "10.00",
  "salePrice": "20.00",
  "saleType": "retail"
}
```

**Response (Code Automatically Generated):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174003",
    "code": "PROD0000004",
    "name": "Custom Product",
    "unit": "piece",
    "description": null,
    "stock": 0,
    "purchasePrice": "10.00",
    "salePrice": "20.00",
    "saleType": "retail",
    "createdAt": "2025-01-10T08:55:30.012Z",
    "updatedAt": "2025-01-10T08:55:30.012Z"
  },
  "message": "Product created successfully",
  "timestamp": "2025-01-10T08:55:30.012Z"
}
```

## Error Handling

### Validation Errors

**Request with Invalid Data:**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "",
  "unit": "piece",
  "purchasePrice": "invalid",
  "salePrice": "20.00",
  "saleType": "retail"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Product name is required",
    "details": [
      {
        "field": "name",
        "message": "Product name is required",
        "value": ""
      },
      {
        "field": "purchasePrice",
        "message": "Purchase price must be a valid decimal number with up to 2 decimal places"
      }
    ]
  },
  "timestamp": "2025-01-10T08:56:45.345Z"
}
```

### Code Generation Errors

**Maximum Sequence Limit Reached:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot create product: Maximum product code sequence limit reached. Please contact system administrator.",
    "details": {
      "field": "code",
      "reason": "sequence_exhausted"
    }
  },
  "timestamp": "2025-01-10T08:57:12.678Z"
}
```

## Response Format

All API responses follow a consistent format:

### Success Response
```typescript
{
  success: true,
  data: Product,           // The created product object
  message?: string,        // Optional success message
  timestamp: string        // ISO 8601 timestamp
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,          // Error code (e.g., "VALIDATION_ERROR")
    message: string,       // Human-readable error message
    details?: any          // Optional error details
  },
  timestamp: string,       // ISO 8601 timestamp
  path?: string           // Optional request path
}
```

## Key Features

1. **Automatic Code Generation**: Codes are generated automatically following the `PROD0000001` pattern
2. **Sequential Numbering**: Each new product gets the next available sequence number
3. **Concurrency Safe**: Multiple simultaneous requests will receive unique codes
4. **Backward Compatible**: Existing API clients continue to work without changes
5. **Consistent Response Format**: All responses follow the same structure
6. **Comprehensive Error Handling**: Clear error messages for various failure scenarios
7. **Code Immutability**: Product codes cannot be modified after creation

## Migration Notes

- **No Breaking Changes**: Existing API clients will continue to work
- **Optional Code Field**: The `code` field in creation requests is now optional
- **Automatic Generation**: When `code` is not provided or is empty, it will be generated automatically
- **Response Includes Code**: All successful creation responses include the generated code
- **Validation Updates**: Code validation now supports both PROD format and legacy formats for manual codes (though manual codes are ignored)