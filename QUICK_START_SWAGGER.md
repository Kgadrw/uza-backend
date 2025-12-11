# Quick Start: Swagger API Documentation

## Installation

First, install the Swagger dependencies:

```bash
cd backend
npm install
```

This will install:
- `swagger-jsdoc` - For generating Swagger specs from JSDoc comments
- `swagger-ui-express` - For serving Swagger UI

## Access Swagger

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Open Swagger UI in your browser:**
   - **Local**: http://localhost:5000/api-docs
   - **Production**: https://your-deployed-url.com/api-docs

## Using Swagger

### 1. Test Public Endpoints (No Auth Required)

- **Health Check**: `GET /health`
- **Register**: `POST /api/v1/auth/register`
- **Login**: `POST /api/v1/auth/login`

### 2. Get Authentication Token

1. Use the **Login** endpoint (`POST /api/v1/auth/login`)
2. Click "Try it out"
3. Enter credentials:
   ```json
   {
     "email": "donor@example.com",
     "password": "Donor123!"
   }
   ```
4. Click "Execute"
5. Copy the `token` from the response

### 3. Authorize in Swagger

1. Click the **"Authorize"** button (🔒) at the top right
2. In the "Value" field, enter: `Bearer <your-token>`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**
4. Click **"Close"**

Now you can test all protected endpoints!

### 4. Test Protected Endpoints

After authorization, you can test:
- Donor dashboard endpoints
- Beneficiary dashboard endpoints
- Admin dashboard endpoints
- File upload endpoints
- Export endpoints

## Environment Configuration

### For Local Development

Your `.env` file should have:
```env
BACKEND_URL=http://localhost:5000
NODE_ENV=development
```

### For Production Deployment

Update your `.env` file:
```env
BACKEND_URL=https://your-actual-backend-url.com
NODE_ENV=production
```

Swagger will automatically use the `BACKEND_URL` for API requests in production.

## All Documented Endpoints

### ✅ Authentication (7 endpoints)
- Register, Login, Refresh Token, Logout, Get Me, Update Profile, Change Password

### ✅ Donor Dashboard (7 endpoints)
- Dashboard Overview, Projects, Project Details, Milestones, Ledger, Alerts, Notifications

### ✅ Beneficiary Dashboard (9 endpoints)
- Dashboard Overview, Donors, Funding Requests (GET/POST), Milestones, Upload Evidence, Missing Documents, Reports

### ✅ Admin Dashboard (13 endpoints)
- Dashboard, Projects, Update Project Status, Milestones (Pending/Approve/Reject), KYC (Pending/Approve/Reject), Reports (4 types)

### ✅ File Upload (2 endpoints)
- Upload File, Delete File

### ✅ Export (1 endpoint)
- Export Data (CSV/PDF)

### ✅ Health (1 endpoint)
- Health Check

**Total: 40+ API endpoints fully documented!**

## Features

✨ **Interactive Testing** - Test all APIs directly from the browser
🔐 **JWT Authentication** - Easy token management
📝 **Request/Response Examples** - See exactly what to send and receive
🌍 **Environment Aware** - Automatically uses deployed URL
📚 **Complete Documentation** - Every endpoint is documented

## Troubleshooting

**Can't see Swagger UI?**
- Make sure server is running on port 5000
- Check that packages are installed: `npm install`
- Verify route is registered in `server.js`

**Authentication not working?**
- Make sure you include "Bearer " before the token
- Check that token hasn't expired
- Verify you logged in first

**Production URL not working?**
- Set `BACKEND_URL` in `.env` file
- Restart the server
- Check that the URL is accessible

## Next Steps

1. Install dependencies: `npm install`
2. Start server: `npm run dev`
3. Open Swagger: http://localhost:5000/api-docs
4. Test your APIs! 🚀

