# Deployed Backend URL

## Your Deployed Backend

**URL**: https://uza-backend.onrender.com

**Swagger Documentation**: https://uza-backend.onrender.com/api-docs/

## Configuration

### Update .env File

Make sure your `backend/.env` file has:

```env
BACKEND_URL=https://uza-backend.onrender.com
```

### Swagger Configuration

Swagger is configured to use your deployed URL:
- **Swagger UI**: https://uza-backend.onrender.com/api-docs/
- **API Base URL**: https://uza-backend.onrender.com

## Access Points

### Swagger Documentation
- **Local Access**: http://localhost:5000/api-docs (when running locally)
- **Deployed Access**: https://uza-backend.onrender.com/api-docs/

### API Endpoints
All API endpoints are available at:
```
https://uza-backend.onrender.com/api/v1/
```

Examples:
- Login: `POST https://uza-backend.onrender.com/api/v1/auth/login`
- Donor Dashboard: `GET https://uza-backend.onrender.com/api/v1/donor/dashboard/overview`
- Admin Dashboard: `GET https://uza-backend.onrender.com/api/v1/admin/dashboard`

## Testing

1. **Open Swagger UI:**
   - Deployed: https://uza-backend.onrender.com/api-docs/
   - Local: http://localhost:5000/api-docs (points to deployed server)

2. **Test APIs:**
   - All API calls from Swagger will go to: `https://uza-backend.onrender.com`
   - No localhost option is shown

3. **Authentication:**
   - Use the login endpoint to get a token
   - Click "Authorize" and enter: `Bearer <your-token>`

## Important Notes

✅ **Swagger uses deployed URL** - All API calls go to your Render deployment
✅ **No localhost in Swagger** - Only the deployed server is shown
✅ **CORS configured** - Make sure your frontend URL is in CORS_ORIGIN

## Environment Variables

Your `.env` should have:

```env
BACKEND_URL=https://uza-backend.onrender.com
CORS_ORIGIN=https://your-frontend-url.com
NODE_ENV=production
```

## Render Deployment

Your backend is deployed on Render:
- **Service**: Render
- **URL**: https://uza-backend.onrender.com
- **Swagger**: https://uza-backend.onrender.com/api-docs/

Make sure Render has your environment variables set:
- `MONGODB_URI`
- `BACKEND_URL`
- `CLOUDINARY_*` credentials
- `JWT_SECRET`
- All other required env vars

