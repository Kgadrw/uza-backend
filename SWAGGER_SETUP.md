# Swagger API Documentation Setup

## Overview

Swagger documentation is now set up for all backend APIs. You can access it at:

- **Local Development**: `http://localhost:5000/api-docs`
- **Production**: `https://your-deployed-url.com/api-docs`

## Features

✅ **Complete API Documentation** - All endpoints documented
✅ **Interactive Testing** - Test APIs directly from Swagger UI
✅ **Authentication Support** - JWT token authentication
✅ **Environment Aware** - Automatically uses deployed URL when in production
✅ **Request/Response Examples** - All endpoints have examples

## Accessing Swagger

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:5000/api-docs
   ```

## Using Authentication in Swagger

1. First, login using the `/api/v1/auth/login` endpoint
2. Copy the `token` from the response
3. Click the **"Authorize"** button at the top right
4. Enter: `Bearer <your-token>`
5. Click **"Authorize"** and **"Close"**
6. Now you can test protected endpoints!

## API Endpoints Documented

### Authentication
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login
- POST `/api/v1/auth/refresh` - Refresh token
- POST `/api/v1/auth/logout` - Logout
- GET `/api/v1/auth/me` - Get current user
- PUT `/api/v1/auth/profile` - Update profile
- PUT `/api/v1/auth/change-password` - Change password

### Donor Dashboard
- GET `/api/v1/donor/dashboard/overview` - Dashboard overview
- GET `/api/v1/donor/projects` - Get projects
- GET `/api/v1/donor/projects/{id}` - Get project details
- GET `/api/v1/donor/milestones` - Get milestones
- GET `/api/v1/donor/ledger` - Transaction history
- GET `/api/v1/donor/alerts` - Get alerts
- GET `/api/v1/donor/notifications` - Get notifications

### Beneficiary Dashboard
- GET `/api/v1/beneficiary/dashboard/overview` - Dashboard overview
- GET `/api/v1/beneficiary/donors` - Get donors
- GET `/api/v1/beneficiary/funding-requests` - Get funding requests
- POST `/api/v1/beneficiary/funding-requests` - Create funding request
- GET `/api/v1/beneficiary/projects/{id}/milestones` - Get milestones
- POST `/api/v1/beneficiary/milestones/{id}/evidence` - Upload evidence
- GET `/api/v1/beneficiary/missing-documents` - Get missing documents
- GET `/api/v1/beneficiary/reports/funding-progress` - Funding progress
- GET `/api/v1/beneficiary/reports/project-status` - Project status

### Admin Dashboard
- GET `/api/v1/admin/dashboard` - Admin dashboard stats
- GET `/api/v1/admin/projects` - Get all projects
- PUT `/api/v1/admin/projects/{id}/status` - Update project status
- GET `/api/v1/admin/milestones/pending` - Pending milestones
- POST `/api/v1/admin/milestones/{id}/approve` - Approve milestone
- POST `/api/v1/admin/milestones/{id}/reject` - Reject milestone
- GET `/api/v1/admin/kyc/pending` - Pending KYC
- POST `/api/v1/admin/kyc/{id}/approve` - Approve KYC
- POST `/api/v1/admin/kyc/{id}/reject` - Reject KYC
- GET `/api/v1/admin/reports/user-registration` - User registration report
- GET `/api/v1/admin/reports/funding-distribution` - Funding distribution
- GET `/api/v1/admin/reports/project-status` - Project status breakdown
- GET `/api/v1/admin/reports/top-donors` - Top donors

### File Upload
- POST `/api/v1/upload` - Upload file
- DELETE `/api/v1/upload/{id}` - Delete file

### Export
- POST `/api/v1/export` - Export data (CSV/PDF)

## Configuration

The Swagger configuration automatically detects your environment:

- **Development**: Uses `http://localhost:5000`
- **Production**: Uses `BACKEND_URL` from `.env` file

Make sure to set `BACKEND_URL` in your `.env` file for production:

```env
BACKEND_URL=https://your-deployed-backend-url.com
```

## Testing APIs

1. **Open Swagger UI** at `/api-docs`
2. **Expand an endpoint** you want to test
3. **Click "Try it out"**
4. **Fill in the parameters** (if any)
5. **Click "Execute"**
6. **View the response** below

## Example: Testing Login

1. Go to `/api/v1/auth/login`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "email": "donor@example.com",
     "password": "Donor123!"
   }
   ```
4. Click "Execute"
5. Copy the `token` from response
6. Use it in the "Authorize" button for protected endpoints

## Updating Documentation

To add or update API documentation, edit the route files in `src/routes/` and add Swagger comments using the `@swagger` tag.

Example:
```javascript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [Your Tag]
 *     responses:
 *       200:
 *         description: Success response
 */
```

## Troubleshooting

**Swagger not loading?**
- Make sure server is running
- Check that `swagger-jsdoc` and `swagger-ui-express` are installed
- Verify the route is registered in `server.js`

**Authentication not working?**
- Make sure you're using `Bearer <token>` format
- Check that token hasn't expired
- Verify you're logged in first

**Production URL not showing?**
- Set `BACKEND_URL` in your `.env` file
- Restart the server

