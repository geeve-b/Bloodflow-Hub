# Bloodflow Hub - Search, Filter & Expiry Alert Implementation

## Overview
This implementation adds production-ready search and filter functionality for blood requests and expiry alerts for blood inventory.

## Features Implemented

### 1. Blood Request Search & Filter
**File:** `server/storage.ts`
- Method: `searchAndFilterBloodRequests()`
- Supports multiple filter criteria:
  - Blood type
  - Urgency level (low, medium, high, critical)
  - Location (hospital name, case-insensitive)
  - Status (pending, approved, fulfilled, rejected)
  - Free-text search

**API Endpoint:** `GET /api/blood-requests/search/advanced`

Query Parameters:
```
- search: string (optional) - Search blood type, location, or requester name
- bloodType: string (optional) - Filter by blood type
- urgency: string (optional) - Filter by urgency
- location: string (optional) - Filter by hospital/location
- status: string (optional) - Filter by request status
- skip: number (optional, default: 0) - Pagination offset
- limit: number (optional, default: 50) - Results per page
```

Response:
```json
{
  "requests": [...],
  "total": number,
  "page": number,
  "pageSize": number,
  "totalPages": number
}
```

### 2. Blood Inventory Expiry Alerts
**File:** `server/storage.ts`
- Method: `getBloodInventoryExpiringWithin(days: number)`
- Identifies blood units expiring within specified period
- Calculates remaining days automatically
- Excludes expired and used units
- Sorted by expiry date (nearest first)

**API Endpoint:** `GET /api/blood-inventory/expiry/alerts`

Query Parameters:
```
- days: number (optional, default: 7) - Look-ahead period in days
```

Response:
```json
{
  "expiringUnits": [
    {
      "_id": "string",
      "hospitalId": "string",
      "bloodType": "string",
      "quantity": number,
      "expiryDate": "ISO date",
      "status": "available|reserved",
      "daysRemaining": number,
      ...
    }
  ],
  "totalExpiringWithin": number,
  "warningPeriodDays": number
}
```

## Database Indexes (Recommended)

For optimal performance, create these MongoDB indexes:

```javascript
// Blood Requests
db.bloodRequests.createIndex({ bloodType: 1 })
db.bloodRequests.createIndex({ urgency: 1 })
db.bloodRequests.createIndex({ status: 1 })
db.bloodRequests.createIndex({ hospitalName: 1 })
db.bloodRequests.createIndex({ createdAt: -1 })
db.bloodRequests.createIndex({ bloodType: 1, urgency: 1, status: 1 })

// Blood Inventory
db.bloodInventory.createIndex({ status: 1, expiryDate: 1 })
db.bloodInventory.createIndex({ expiryDate: 1 })
db.bloodInventory.createIndex({ bloodType: 1 })
db.bloodInventory.createIndex({ hospitalId: 1 })
```

Execute using the provided `server/indexes.ts` file or manually in MongoDB.

## Implementation Details

### Query Building
- **File:** `server/filters.ts`
- `buildMongoQuery()` - Constructs MongoDB query from filter parameters
- Case-insensitive regex patterns for location and search
- Supports combined filters with $or operators
- Handles null/undefined parameters gracefully

### Expiry Calculation
- **File:** `server/filters.ts`
- `calculateDaysRemaining()` - Ceiling-based day calculation
- `isBloodExpiringSoon()` - Boolean check for warning period
- `isBloodExpired()` - Check if unit is already expired
- `categorizeExpiryStatus()` - Classify severity (critical: ≤2 days, warning: ≤7 days)

## Security Considerations

1. **Input Validation:**
   - All filter parameters validated at route level
   - Query string parameters sanitized by Express
   - Zod schema validation for data structures

2. **Access Control:**
   - Routes can be protected with role-based middleware
   - Existing JWT authentication applies to endpoints
   - Add route protection as needed per dashboard type

3. **Query Optimization:**
   - Indexed fields used for fast filtering
   - Pagination prevents large dataset returns
   - Sorting by creation date for consistency

## Usage Examples

### Search by Blood Type and Urgency
```
GET /api/blood-requests/search/advanced?bloodType=O+&urgency=critical&skip=0&limit=25
```

### Filter by Location with Free-Text Search
```
GET /api/blood-requests/search/advanced?location=Mumbai&search=urgent&skip=0&limit=50
```

### Get Expiring Units (7-day window)
```
GET /api/blood-inventory/expiry/alerts?days=7
```

### Get Critical Expiry Alerts (2-day window)
```
GET /api/blood-inventory/expiry/alerts?days=2
```

## Performance Notes

- Search queries optimized with single regex pass
- Pagination default limit: 50 (configurable)
- Expiry queries use date range index
- Combined indexes for multi-field filters
- All queries return counts for pagination UI

## Error Handling

- Invalid ObjectId returns 404
- Database errors return 500 with generic message
- Empty results return 200 with empty array
- No results still returns valid response structure

## Future Enhancements

1. Add caching layer (Redis) for frequent queries
2. Implement full-text search indexes
3. Add export to PDF/CSV for reports
4. Automated email alerts for expiring units
5. Advanced analytics dashboard
6. Donor compatibility suggestions based on requests
