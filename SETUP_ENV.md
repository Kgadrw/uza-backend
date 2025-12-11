# Environment Setup Instructions

## Create .env File

Since `.env` files are gitignored for security, you need to create it manually.

### Steps:

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create the .env file:**
   ```bash
   # On Windows (PowerShell)
   New-Item -Path .env -ItemType File
   
   # On Mac/Linux
   touch .env
   ```

3. **Copy the content below into your .env file:**

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB
# Note: The @ symbol in the password must be URL encoded as %40
MONGODB_URI=mongodb+srv://gad:Kigali20%40@cluster0.uamtdm9.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0

# Redis (Optional - configure when you set up Redis)
# REDIS_URL=redis://localhost:6379
# OR Upstash
# UPSTASH_REDIS_REST_URL=https://your-endpoint.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your-token

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-characters
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# File Storage - Cloudinary
CLOUDINARY_CLOUD_NAME=dgmexpa8v
CLOUDINARY_API_KEY=577674637224497
CLOUDINARY_API_SECRET=_8Ks_XU3nurQTFUbVA3RxpbcXFE
CLOUDINARY_URL=cloudinary://577674637224497:_8Ks_XU3nurQTFUbVA3RxpbcXFE@dgmexpa8v

# File Storage - AWS S3 (Alternative - Optional)
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=uzaempower-uploads

# Email - SendGrid (Configure when you set up email)
# SENDGRID_API_KEY=SG.your-api-key
# SENDGRID_FROM_EMAIL=noreply@uzaempower.com

# SMS - Twilio (Optional)
# TWILIO_ACCOUNT_SID=your-account-sid
# TWILIO_AUTH_TOKEN=your-auth-token
# TWILIO_PHONE_NUMBER=+1234567890

# Payment - Stripe (Optional)
# STRIPE_SECRET_KEY=sk_test_your-secret-key
# STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
# STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Error Tracking - Sentry (Optional)
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# SENTRY_ENVIRONMENT=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# App URLs
FRONTEND_URL=http://localhost:3000
# For production, set this to your deployed backend URL
# Example: BACKEND_URL=https://api.uzaempower.com
BACKEND_URL=http://localhost:5000

# Logging
LOG_LEVEL=info
```

## Important Notes:

1. **JWT Secrets**: Change the `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong, random strings (at least 32 characters) before deploying to production.

2. **MongoDB Password**: The password `Kigali20@` is already included in the connection string.

3. **Cloudinary**: All your Cloudinary credentials are configured and ready to use.

4. **Optional Services**: Services like Redis, SendGrid, Twilio, etc. are commented out. Uncomment and configure them when needed.

## Verify Setup:

After creating the `.env` file, you can verify it's working by:

```bash
# Install dependencies
npm install

# Start the server
npm run dev
```

The server should connect to MongoDB and be ready to use Cloudinary for file uploads!

