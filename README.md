# 🚕 Ride System Backend API

A **scalable ride-booking backend system** built with **TypeScript, Express.js, MongoDB (Mongoose)**, featuring:

- 🔐 Role-based Access Control (ADMIN, DRIVER, RIDER)
- 🛡 JWT + Passport Authentication
- 🧾 Zod schema validation
- 📍 Location tracking with geolocation
- 🧩 Modular route architecture
- 🛠️ Scheduled jobs (`cron`) for user state updates
- ✅ Robust error handling
- ⭐ Rating system for completed rides
- 🚗 Vehicle management for drivers

---

## 📁 Project Structure

```
src/
├── modules/
│   ├── auth/          # Authentication logic
│   ├── user/          # User management
│   ├── driver/        # Driver operations
│   ├── ride/          # Ride booking system
│   ├── admin/         # Admin panel operations
├── middlewares/       # Auth, validation, location tracking
├── utils/            # Helper functions
├── routes/           # Route definitions
└── config/          # Database and app configuration
```

---

## ⚙️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Type-safe Node.js runtime |
| **Express.js** | Backend web framework |
| **MongoDB + Mongoose** | NoSQL database + ODM |
| **Zod** | Request schema validation |
| **JWT + Passport.js** | Secure authentication |
| **GeoIP & Location** | Track user/device location |
| **CRON Jobs** | Scheduled background tasks |
| **Cookie Parser** | Session management |
| **CORS** | Cross-origin resource sharing |

---

## 👥 User Roles & Permissions

### 🏠 ADMIN
- **Full system access** - Can manage all users, drivers, and rides
- **User Management** - Block/unblock users, delete blocked users
- **Driver Management** - Suspend/unsuspend drivers, approve driver applications
- **Ride Management** - View all rides, delete rides
- **Analytics** - Access to all system data

### 🚗 DRIVER
- **Ride Operations** - Accept, pickup, transit, and complete rides
- **Vehicle Management** - Update vehicle information
- **Status Management** - Check ride requests, manage driver state
- **Profile Updates** - Update personal information

### 🧍 RIDER
- **Ride Booking** - Request rides with location coordinates
- **Ride Rating** - Rate completed rides (1-5 stars)
- **Profile Management** - Update personal information

---

## 🔄 Complete User Journey

### 1. 🔐 Authentication Flow
```
1. User registers → Creates account with role
2. User logs in → Receives JWT token (stored in cookie)
3. Token validates requests → Middleware checks permissions
4. User logs out → Token invalidated, location updated
```

### 2. 🧍 Rider Journey
```
1. Rider logs in → JWT token issued
2. Request ride → POST /api/ride/request (lat, lng)
3. Wait for driver → System matches with available drivers
4. Ride accepted → Driver picks up rider
5. Ride completed → Rate the experience
```

### 3. 👨‍✈️ Driver Journey
```
1. Driver logs in → Status set to AVAILABLE
2. Check requests → GET /api/driver/check-ride-request
3. Accept ride → POST /api/driver/accept-ride-request/:id
4. Pick up rider → PATCH /api/driver/pick-up/:id
5. Start journey → PATCH /api/driver/in-transit/:id
6. Complete ride → PATCH /api/driver/complete-ride/:id
```

### 4. 👮 Admin Journey
```
1. Admin logs in → Full system access
2. Monitor users → GET /api/admin/user/all
3. Manage drivers → Approve/suspend as needed
4. Oversee rides → View and manage all ride data
5. System maintenance → Block problematic users
```

---

## 📦 Complete API Reference

### 🔐 Authentication APIs (`/api/auth`)

| Method | Endpoint | Access | Description | Request Body |
|--------|----------|--------|-------------|--------------|
| `POST` | `/login` | Public | User login with email/password | `{email, password}` |
| `POST` | `/logout` | Protected | Logout and update location | `{}` |
| `POST` | `/refresh-token` | Protected | Refresh JWT token | `{}` |

**Sample Login Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "SecurePass123"
  }'
```

---

### 👤 User Management APIs (`/api/user`)

| Method | Endpoint | Access | Description | Request Body |
|--------|----------|--------|-------------|--------------|
| `POST` | `/create` | Public | Register new user | `{name, email, password, role, vehicleInfo?, driverStatus?}` |
| `GET` | `/me` | Protected | Get current user profile | `{}` |
| `PATCH` | `/update-user/:id` | Protected | Update user information | `{name?, password?}` |

**Sample Registration Requests:**

*Rider Registration:*
```json
{
  "name": "John Doe",
  "email": "john.rider@example.com",
  "password": "SecurePass123",
  "role": "rider"
}
```

*Driver Registration:*
```json
{
  "name": "Mike Driver",
  "email": "mike.driver@example.com",
  "password": "DriveSafe2024",
  "role": "driver",
  "vehicleInfo": {
    "license": "ABC123456",
    "model": "Toyota Corolla",
    "plateNumber": "DHK1234"
  },
  "driverStatus": "AVAILABLE"
}
```

*Admin Registration:*
```json
{
  "name": "System Admin",
  "email": "admin@example.com",
  "password": "AdminSecure123",
  "role": "admin"
}
```

---

### 🛺 Ride Management APIs (`/api/ride`)

| Method | Endpoint | Access | Description | Request Body |
|--------|----------|--------|-------------|--------------|
| `POST` | `/request` | Rider/Admin | Request a new ride | `{lat, lng}` |
| `POST` | `/rating/:id` | Rider/Admin | Rate completed ride | `{rating}` |

**Sample Ride Request:**
```bash
curl -X POST http://localhost:5000/api/ride/request \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 23.81,
    "lng": 90.41
  }'
```

**Sample Rating Request:**
```json
{
  "rating": 5
}
```

---

### 🚗 Driver Operations APIs (`/api/driver`)

| Method | Endpoint | Access | Description | Request Body |
|--------|----------|--------|-------------|--------------|
| `POST` | `/check-ride-request` | Driver | Check available ride requests | `{}` |
| `POST` | `/accept-ride-request/:id` | Driver/Admin | Accept a ride request | `{}` |
| `POST` | `/cancel-ride-request/:id` | All Roles | Cancel a ride request | `{}` |
| `PATCH` | `/pick-up/:id` | Driver | Mark ride as picked up | `{}` |
| `PATCH` | `/in-transit/:id` | Driver | Mark ride in progress | `{}` |
| `PATCH` | `/complete-ride/:id` | Driver | Mark ride as completed | `{}` |
| `PATCH` | `/driver-update-vehicle/:id` | Driver/Admin | Update vehicle information | `{license?, model?, plateNumber?}` |
| `GET` | `/driver-state/:id` | Driver/Admin | Get driver current state | `{}` |

**Sample Vehicle Update:**
```json
{
  "license": "XYZ789012",
  "model": "Honda Civic",
  "plateNumber": "DHK5678"
}
```

---

### 🛠️ Admin Panel APIs (`/api/admin`)

#### User Management
| Method | Endpoint | Access | Description | Parameters |
|--------|----------|--------|-------------|------------|
| `GET` | `/user/all` | Admin | List all users | - |
| `GET` | `/user/:id` | Admin | Get specific user | `id` |
| `PATCH` | `/block-user/:id/:blockParam` | Admin | Block/unblock user | `block` or `rollback` |
| `DELETE` | `/delete-blocked-user/:id` | Admin | Delete blocked user | `id` |

#### Driver Management
| Method | Endpoint | Access | Description | Parameters |
|--------|----------|--------|-------------|------------|
| `GET` | `/driver/all` | Admin | List all drivers | - |
| `GET` | `/driver/:id` | Admin | Get specific driver | `id` |
| `PATCH` | `/suspend-driver/:id/:suspendParam` | Admin | Suspend/unsuspend driver | `suspend` or `rollback` |
| `PATCH` | `/approve-driver/:id/:approveParam` | Admin | Approve driver application | `approved` or `notApproved` |

#### Ride Management
| Method | Endpoint | Access | Description | Parameters |
|--------|----------|--------|-------------|------------|
| `GET` | `/all-rides` | Admin | Get all ride requests | - |
| `GET` | `/ride/:id` | Admin | Get ride by ID | `id` |
| `DELETE` | `/ride/:id` | Admin | Delete a ride | `id` |

**Sample Admin Operations:**
```bash
# Block a user
curl -X PATCH http://localhost:5000/api/admin/block-user/123/block \
  -H "Authorization: Bearer <admin-token>"

# Approve a driver
curl -X PATCH http://localhost:5000/api/admin/approve-driver/456/approved \
  -H "Authorization: Bearer <admin-token>"
```

---

## 🔍 Validation Schemas (Zod)

### User Registration Schema
```typescript
const zodUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .regex(/^(?=.*[A-Z])/, "Must contain uppercase letter")
    .regex(/^(?=.*[!@#$%^&*])/, "Must contain special character")
    .regex(/^(?=.*\d)/, "Must contain number"),
  role: z.enum(["admin", "driver", "rider"]),
  vehicleInfo: z.object({
    license: z.string().min(1),
    model: z.string().min(1),
    plateNumber: z.string().min(1)
  }).optional(),
  driverStatus: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]).optional()
});
```

### Ride Request Schema
```typescript
const zodRideRequest = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});
```

### Rating Schema
```typescript
const ratingZodSchema = z.object({
  rating: z.number().min(1).max(5)
});
```

### Vehicle Update Schema
```typescript
const vehicleInfoZodSchema = z.object({
  license: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  plateNumber: z.string().min(1).optional()
}).refine(
  data => Object.keys(data).some(key => data[key] !== undefined),
  "At least one field must be provided for update"
);
```

### User Update Schema
```typescript
const updateUserZodSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  password: z.string()
    .min(8)
    .regex(/^(?=.*[A-Z])/, "Must contain uppercase letter")
    .regex(/^(?=.*[!@#$%^&*])/, "Must contain special character")
    .regex(/^(?=.*\d)/, "Must contain number")
    .optional()
}).refine(
  data => Object.values(data).some(val => val !== undefined),
  "At least one field must be provided for update"
);
```

---

## 📍 Location Tracking System

### How It Works
1. **Automatic Tracking**: Every protected route automatically updates user location
2. **IP-based Location**: Uses GeoIP to determine approximate location
3. **Manual Coordinates**: Riders provide exact pickup coordinates
4. **Real-time Updates**: Location updated on login, logout, and API calls

### Location Middleware
```typescript
// Automatically applied to protected routes
updateUserLocationIntoDb(req, res, next)
trackLocationByLatLng(req, res, next)
```

---

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Different permissions for each user type
- **Cookie Storage**: Secure token storage in HTTP-only cookies
- **Session Management**: Passport.js session handling

### Input Validation
- **Zod Schemas**: Comprehensive request validation
- **Type Safety**: TypeScript ensures type consistency
- **Error Handling**: Graceful error responses
- **SQL Injection Prevention**: MongoDB's natural protection

### Security Middleware
```typescript
// Applied to all routes
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
```

---

## ⏱ Background Jobs & Automation

### Scheduled Tasks
```typescript
// User offline status management
scheduleUserOfflineJob(); // Runs via cron
```

### Features
- **Auto-offline**: Mark inactive users as offline
- **Location Updates**: Continuous location tracking
- **Status Management**: Automatic driver status updates
- **System Cleanup**: Remove expired sessions

---

## 🧰 Error Handling

### Global Error Middleware
- **Consistent Responses**: Standardized error format
- **Zod Validation Errors**: User-friendly validation messages
- **JWT Errors**: Authentication error handling
- **Database Errors**: MongoDB error management
- **Custom Errors**: Application-specific error types

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "statusCode": 400
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd ride-system-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your environment
# Edit .env with your settings

# Start development server
npm run dev
```

### Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/ride_system

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
TOKEN_EXPIRES_IN=1d

# Session
SESSION_SECRET=your_session_secret_here

# Optional: External Services
GEOIP_API_KEY=your_geoip_api_key
```

---

## 🧪 API Testing Examples

### Complete Testing Flow

#### 1. Register Users
```bash
# Register a rider
curl -X POST http://localhost:5000/api/user/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Rider",
    "email": "alice@example.com",
    "password": "SecurePass123",
    "role": "rider"
  }'

# Register a driver
curl -X POST http://localhost:5000/api/user/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Driver",
    "email": "bob@example.com",
    "password": "DriveSafe2024",
    "role": "driver",
    "vehicleInfo": {
      "license": "ABC123456",
      "model": "Toyota Corolla",
      "plateNumber": "DHK1234"
    },
    "driverStatus": "AVAILABLE"
  }'
```

#### 2. Login and Get Tokens
```bash
# Login as rider
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "SecurePass123"}'

# Login as driver
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com", "password": "DriveSafe2024"}'
```

#### 3. Complete Ride Flow
```bash
# Rider requests ride
curl -X POST http://localhost:5000/api/ride/request \
  -H "Content-Type: application/json" \
  -d '{"lat": 23.81, "lng": 90.41}'

# Driver checks available requests
curl -X POST http://localhost:5000/api/driver/check-ride-request \

# Driver accepts ride
curl -X POST http://localhost:5000/api/driver/accept-ride-request/RIDE_ID \

# Driver picks up rider
curl -X PATCH http://localhost:5000/api/driver/pick-up/RIDE_ID \

# Driver starts journey
curl -X PATCH http://localhost:5000/api/driver/in-transit/RIDE_ID \

# Driver completes ride
curl -X PATCH http://localhost:5000/api/driver/complete-ride/RIDE_ID \

# Rider rates the ride
curl -X POST http://localhost:5000/api/ride/rating/RIDE_ID \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

---

## 🔧 Development & Deployment

### Available Scripts
```bash
# Development
npm run dev          # Start with nodemon
npm run build        # Compile TypeScript
npm run start        # Production start

# Testing
npm run test         # Run test suite
npm run test:watch   # Watch mode testing

# Linting
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix issues
```

### Production Deployment
1. **Environment Setup**: Configure production environment variables
2. **Database**: Set up MongoDB cluster
3. **Build**: Compile TypeScript (`npm run build`)
4. **Process Manager**: Use PM2 for process management
5. **Reverse Proxy**: Configure Nginx for load balancing
6. **SSL**: Set up HTTPS certificates
7. **Monitoring**: Implement logging and monitoring

---

## 📊 Database Schema Overview

### Collections
- **users**: User profiles and authentication data
- **rides**: Ride requests and journey information
- **sessions**: User session management
- **locations**: Location tracking history

### Key Relationships
- User → Rides (One-to-Many)
- Driver → Vehicle Info (One-to-One)
- Ride → Rating (One-to-One)
- User → Location History (One-to-Many)

---

## 🎯 Business Logic Summary

### Core Features
1. **Multi-role System**: Admins, Drivers, and Riders with distinct capabilities
2. **Real-time Matching**: Connect riders with available drivers
3. **Location Services**: GPS tracking and location-based matching
4. **Rating System**: Quality assurance through rider feedback
5. **Admin Panel**: Complete system management and oversight
6. **Vehicle Management**: Driver vehicle registration and updates
7. **Status Tracking**: Real-time ride and user status updates

### Advanced Features
1. **Background Jobs**: Automated system maintenance
2. **Permission System**: Granular access control
3. **Validation Layer**: Comprehensive input validation
4. **Error Handling**: Robust error management
5. **Session Management**: Secure user sessions
6. **Location Tracking**: Continuous location updates

---

## 🧑‍💻 Author

## Github Link : https://github.com/muhamash/Ride-Booking-System
## Live Link : https://ride-booking-system-one.vercel.app/
## Doc : https://github.com/muhamash/Ride-Booking-System/blob/main/Readme.md
## Video Link : https://drive.google.com/file/d/1cerBYwSgy2ppYLXFuxnJ01pd9nSPCKh6/view?usp=sharing

**Muhammad Ashraful**  
Full-Stack Software engineer  
📧 Contact: muhammad-ashraful@outlook.com 
🔗 GitHub: github.com/muhamash

---