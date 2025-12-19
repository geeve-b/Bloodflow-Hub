# Quick Reference Guide

## 🚀 Start Development
```bash
npm run dev
```
Runs on: `http://localhost:5000`

---

## 📡 API Base URL
```
http://localhost:5000/api
```

---

## 📊 Main API Routes Quick Reference

| Feature | Method | Endpoint |
|---------|--------|----------|
| **Check API Status** | GET | `/health` |
| **Get All Users** | GET | `/users` |
| **Create User** | POST | `/users` |
| **Get All Blood Inventory** | GET | `/blood-inventory` |
| **Add Blood to Inventory** | POST | `/blood-inventory` |
| **Get All Blood Requests** | GET | `/blood-requests` |
| **Create Blood Request** | POST | `/blood-requests` |
| **Get All Donors** | GET | `/donors` |
| **Register Donor** | POST | `/donors` |

---

## 💾 MongoDB Collections

- `users` - User accounts
- `bloodInventory` - Blood units
- `bloodRequests` - Blood requests
- `donors` - Donor profiles

---

## 🔑 Blood Types
O+, O-, A+, A-, B+, B-, AB+, AB-

---

## 📦 Request Body Examples

### Create User
```json
{
  "username": "john_doe",
  "password": "SecurePass123",
  "email": "john@example.com",
  "role": "donor"
}
```

### Add Blood to Inventory
```json
{
  "hospitalId": "hospital123",
  "bloodType": "O+",
  "quantity": 50,
  "expiryDate": "2025-12-31T23:59:59Z",
  "status": "available"
}
```

### Create Blood Request
```json
{
  "requesterId": "user123",
  "requesterName": "Dr. Smith",
  "hospitalName": "City Hospital",
  "bloodType": "O+",
  "quantity": 5,
  "urgency": "high",
  "reason": "Surgery needed"
}
```

### Register Donor
```json
{
  "userId": "user123",
  "firstName": "John",
  "lastName": "Doe",
  "bloodType": "O+",
  "phone": "555-1234",
  "address": "123 Main St"
}
```

---

## 🧪 Test API Endpoints

Windows:
```bash
./test-api.bat
```

Linux/Mac:
```bash
./test-api.sh
```

---

## 📖 Full Documentation

- **API_DOCUMENTATION.md** - Complete endpoint reference
- **BACKEND_SETUP_COMPLETE.md** - Full setup guide
- **MONGODB_SETUP.md** - MongoDB Atlas guide

---

## ⚙️ Configuration

File: `.env`
```
DATABASE_URL=mongodb+srv://bloodflow_user:WIFIGHTERS@cluster0.4cqysnk.mongodb.net/bloodflow_hub?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development
PORT=5000
```

---

## 🔗 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Server Error |

---

## 🛠️ Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Start production server
npm start

# Check TypeScript
npm run check
```

---

## 📝 Notes

- All timestamps are ISO 8601 format
- Passwords are automatically hashed with bcryptjs
- MongoDB ObjectIds used for all document IDs
- Input validation with Zod schemas

---

## ✅ What's Ready

✅ MongoDB Atlas connection  
✅ User management  
✅ Blood inventory tracking  
✅ Blood request system  
✅ Donor management  
✅ Full REST API  
✅ Input validation  
✅ Password hashing  
✅ Error handling  

---

**You're all set! The backend is ready for use.** 🎉
