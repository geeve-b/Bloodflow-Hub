# Quick Reference - Search & Filter Implementation

## API Endpoints

### 1. Search & Filter Blood Requests
```
GET /api/blood-requests/search/advanced
```

**Parameters:**
| Param    | Type   | Example        | Description                           |
|----------|--------|----------------|---------------------------------------|
| search   | string | "urgent blood" | Search term (blood type, location)   |
| bloodType| string | "O+"           | Filter by blood type                 |
| urgency  | string | "high"         | Filter: low, medium, high, critical  |
| location | string | "Mumbai"       | Filter by hospital/location          |
| status   | string | "pending"      | Filter: pending, approved, fulfilled |
| skip     | number | "0"            | Pagination offset                    |
| limit    | number | "50"           | Results per page                     |

**Example:**
```bash
curl "http://localhost:5000/api/blood-requests/search/advanced?bloodType=O+&urgency=high&skip=0&limit=25"
```

**Response:**
```json
{
  "requests": [...],
  "total": 142,
  "page": 1,
  "pageSize": 25,
  "totalPages": 6
}
```

---

### 2. Blood Inventory Expiry Alerts
```
GET /api/blood-inventory/expiry/alerts
```

**Parameters:**
| Param | Type   | Default | Description           |
|-------|--------|---------|----------------------|
| days  | number | 7       | Look-ahead period    |

**Example:**
```bash
curl "http://localhost:5000/api/blood-inventory/expiry/alerts?days=7"
```

**Response:**
```json
{
  "expiringUnits": [
    {
      "_id": "...",
      "bloodType": "O+",
      "quantity": 5,
      "expiryDate": "2026-01-20T10:30:00Z",
      "daysRemaining": 5,
      "status": "available"
    }
  ],
  "totalExpiringWithin": 12,
  "warningPeriodDays": 7
}
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `server/storage.ts` | Database methods for search/filter/expiry |
| `server/routes.ts` | API endpoints (2 new routes added) |
| `server/filters.ts` | Utility functions for query building |
| `server/indexes.ts` | MongoDB index recommendations |
| `API_DOCUMENTATION.ts` | Detailed API docs |
| `IMPLEMENTATION_GUIDE.md` | Full implementation guide |
| `CHANGES_SUMMARY.md` | List of all changes |

---

## MongoDB Indexes (Run Once)

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
```

---

## Common Use Cases

### Get All High Priority O+ Requests
```
GET /api/blood-requests/search/advanced?bloodType=O+&urgency=high
```

### Search Requests by Hospital
```
GET /api/blood-requests/search/advanced?location=Apollo&status=pending
```

### Get Critical Expiry Alerts (2 days)
```
GET /api/blood-inventory/expiry/alerts?days=2
```

### Paginated Search Results
```
GET /api/blood-requests/search/advanced?search=emergency&skip=50&limit=25
```

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad request |
| 404  | Not found |
| 500  | Server error |

---

## Performance Tips

1. Use indexed fields in filters for fastest queries
2. Limit results with `limit` parameter (default 50)
3. Use pagination for large result sets
4. Combine filters instead of multiple requests
5. Days parameter in expiry alerts defaults to 7

---

## Error Handling

All endpoints return JSON errors:
```json
{ "error": "Failed to search blood requests" }
```

Check HTTP status code and error message for debugging.
