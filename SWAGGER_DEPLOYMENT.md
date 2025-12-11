# Swagger Deployment Configuration

## Using Only Deployed Server in Swagger

Swagger is configured to **ONLY** show your deployed server URL. Localhost is **NOT** included.

## Configuration

### Required: Set BACKEND_URL

You **MUST** set `BACKEND_URL` in your `.env` file to your deployed backend URL:

```env
# REQUIRED - Your deployed backend URL
BACKEND_URL=https://uza-backend.onrender.com
```

### Important Notes

⚠️ **Localhost is NOT shown** - Swagger will only display the deployed server URL
⚠️ **BACKEND_URL is required** - If not set, it defaults to `https://api.uzaempower.com`
⚠️ **No fallback** - There's no localhost option in Swagger UI

## Example Configurations

### Production Deployment

```env
NODE_ENV=production
BACKEND_URL=https://uza-backend.onrender.com
```

Swagger will show:
- **Only**: `https://uza-backend.onrender.com` (Deployed server)

### Vercel Deployment

```env
BACKEND_URL=https://uzaempower-backend.vercel.app
```

### Railway Deployment

```env
BACKEND_URL=https://uzaempower-backend.railway.app
```

### Render Deployment

```env
BACKEND_URL=https://uzaempower-backend.onrender.com
```

### Render Deployment (Current)

```env
BACKEND_URL=https://uza-backend.onrender.com
```

## Setup Instructions

1. **Update your `.env` file:**
   ```env
   BACKEND_URL=https://your-actual-deployed-url.com
   ```

2. **Restart your server:**
   ```bash
   npm run dev
   ```

3. **Open Swagger UI:**
   ```
   http://localhost:5000/api-docs
   ```

4. **Verify:**
   - Check the server dropdown at the top
   - You should see **ONLY** your deployed URL
   - No localhost option should appear

## Verification

After setting `BACKEND_URL`:

1. Open Swagger: `http://localhost:5000/api-docs`
2. Look at the top - you should see your deployed URL
3. Test an endpoint - it should call your deployed server
4. Check browser network tab to confirm the URL

## Troubleshooting

**Still seeing localhost?**
- Make sure `BACKEND_URL` is set in `.env`
- Restart the server completely
- Clear browser cache
- Check that the URL doesn't contain `localhost`

**API calls failing?**
- Verify your deployed server is accessible
- Check CORS settings on deployed server
- Ensure the URL is correct (include `https://`)

**Want to test locally?**
- You can still run the server locally
- But Swagger will point to your deployed URL
- To test local APIs, use Postman or curl directly

## Default Behavior

If `BACKEND_URL` is not set, Swagger defaults to:
```
https://uza-backend.onrender.com
```

**Your deployed URL is already configured!** Just make sure `BACKEND_URL` is set in your `.env` file.
