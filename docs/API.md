# UZA Empower API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Donor Dashboard
- `GET /donor/dashboard/overview` - Dashboard overview
- `GET /donor/projects` - Get projects
- `GET /donor/milestones` - Get milestones
- `GET /donor/ledger` - Transaction history
- `GET /donor/alerts` - Get alerts

### Beneficiary Dashboard
- `GET /beneficiary/dashboard/overview` - Dashboard overview
- `GET /beneficiary/funding-requests` - Get funding requests
- `POST /beneficiary/funding-requests` - Create funding request
- `POST /beneficiary/milestones/:id/evidence` - Upload evidence

### Admin Dashboard
- `GET /admin/dashboard` - Admin dashboard stats
- `GET /admin/projects` - All projects
- `POST /admin/milestones/:id/approve` - Approve milestone
- `GET /admin/kyc/pending` - Pending KYC

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

