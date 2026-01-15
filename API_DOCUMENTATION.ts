/**
 * SEARCH & FILTER API ENDPOINTS
 * 
 * Base URL: /api/blood-requests/search/advanced
 * 
 * Query Parameters:
 * - search (string, optional): Search term for blood type, location, or requester name
 * - bloodType (string, optional): Filter by blood type (e.g., "O+", "A-", "B+")
 * - urgency (string, optional): Filter by urgency level ("low", "medium", "high", "critical")
 * - location (string, optional): Filter by hospital name or location (case-insensitive)
 * - status (string, optional): Filter by status ("pending", "approved", "fulfilled", "rejected")
 * - skip (number, optional, default: 0): Number of results to skip for pagination
 * - limit (number, optional, default: 50): Maximum number of results to return
 * 
 * Example Requests:
 * 
 * 1. Search by blood type:
 *    GET /api/blood-requests/search/advanced?bloodType=O+
 * 
 * 2. Search by location with pagination:
 *    GET /api/blood-requests/search/advanced?location=New%20York&skip=0&limit=25
 * 
 * 3. Combined filters:
 *    GET /api/blood-requests/search/advanced?bloodType=A+&urgency=high&status=pending&skip=0&limit=50
 * 
 * 4. Text search:
 *    GET /api/blood-requests/search/advanced?search=hospital%20name&skip=0&limit=25
 * 
 * 5. All filters combined:
 *    GET /api/blood-requests/search/advanced?bloodType=AB-&urgency=critical&location=Mumbai&status=pending&search=urgent&skip=0&limit=25
 * 
 * Response Format:
 * {
 *   "requests": [
 *     {
 *       "_id": "string",
 *       "requesterId": "string",
 *       "requesterName": "string",
 *       "hospitalName": "string",
 *       "bloodType": "string",
 *       "quantity": number,
 *       "urgency": "low|medium|high|critical",
 *       "reason": "string",
 *       "status": "pending|approved|fulfilled|rejected",
 *       "createdAt": "ISO date string",
 *       "updatedAt": "ISO date string"
 *     }
 *   ],
 *   "total": number,
 *   "page": number,
 *   "pageSize": number,
 *   "totalPages": number
 * }
 * 
 * Error Response:
 * {
 *   "error": "Failed to search blood requests"
 * }
 */

/**
 * BLOOD EXPIRY ALERTS API ENDPOINT
 * 
 * Base URL: /api/blood-inventory/expiry/alerts
 * 
 * Query Parameters:
 * - days (number, optional, default: 7): Number of days to look ahead for expiry
 * 
 * Example Requests:
 * 
 * 1. Default 7-day alert window:
 *    GET /api/blood-inventory/expiry/alerts
 * 
 * 2. Custom 14-day alert window:
 *    GET /api/blood-inventory/expiry/alerts?days=14
 * 
 * 3. Strict 2-day critical alert:
 *    GET /api/blood-inventory/expiry/alerts?days=2
 * 
 * Response Format:
 * {
 *   "expiringUnits": [
 *     {
 *       "_id": "string",
 *       "hospitalId": "string",
 *       "bloodType": "string",
 *       "quantity": number,
 *       "expiryDate": "ISO date string",
 *       "status": "available|reserved",
 *       "createdAt": "ISO date string",
 *       "updatedAt": "ISO date string",
 *       "daysRemaining": number
 *     }
 *   ],
 *   "totalExpiringWithin": number,
 *   "warningPeriodDays": number
 * }
 * 
 * Notes:
 * - Results are sorted by expiryDate (nearest expiry first)
 * - Only includes units with status "available" or "reserved"
 * - Excludes already expired units
 * - daysRemaining is calculated as ceiling of (expiryDate - now) / (24 hours)
 * 
 * Error Response:
 * {
 *   "error": "Failed to fetch expiry alerts"
 * }
 */

export {};
