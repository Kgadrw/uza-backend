# UZA Empower Backend

Secure, fast, and reliable backend API for Donor, Beneficiary, and Admin dashboards.

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access + Refresh Tokens)
- **File Storage**: Cloudinary / AWS S3
- **Caching**: Redis
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Error Tracking**: Sentry
- **Testing**: Jest + Supertest

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── services/        # External services
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── validators/      # Request validation schemas
│   ├── types/           # TypeScript types (if using TS)
│   └── app.js           # Express app setup
├── tests/               # Test files
├── scripts/             # Utility scripts
├── docs/                # API documentation
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── server.js            # Entry point
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Start development server:
```bash
npm run dev
```

5. Run tests:
```bash
npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Donor Dashboard
- `GET /api/donor/dashboard/overview` - Dashboard overview
- `GET /api/donor/projects` - Get projects
- `GET /api/donor/milestones` - Get milestones
- `GET /api/donor/ledger` - Transaction history
- `GET /api/donor/alerts` - Get alerts

### Beneficiary Dashboard
- `GET /api/beneficiary/dashboard/overview` - Dashboard overview
- `GET /api/beneficiary/funding-requests` - Funding requests
- `POST /api/beneficiary/funding-requests` - Create funding request
- `POST /api/beneficiary/evidence` - Upload evidence

### Admin Dashboard
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/projects` - All projects
- `POST /api/admin/milestones/:id/approve` - Approve milestone
- `GET /api/admin/kyc/pending` - Pending KYC

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection
- Helmet.js security headers

## Performance

- Redis caching
- Database indexing
- Query optimization
- Response compression
- Connection pooling

