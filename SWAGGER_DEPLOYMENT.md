# Swagger Deployment Configuration

## Using Deployed Server in Swagger

Swagger is configured to automatically use your deployed server URL when available.

## Configuration

### Environment Variable

Set `BACKEND_URL` in your `.env` file to your deployed backend URL:

```env
# For Production/Deployment
BACKEND_URL=https://your-deployed-backend-url.com

# For Local Development
BACKEND_URL=http://localhost:5000
```

### How It Works

1. **If `BACKEND_URL` is set and not localhost:**
   - Swagger will use the deployed URL as the primary server
   - Localhost will be available as a secondary option

2. **If `BACKEND_URL` is localhost or not set:**
   - Swagger will default to localhost

## Example Configurations

### Production Deployment

```env
NODE_ENV=production
BACKEND_URL=https://api.uzaempower.com
```

Swagger will show:
- **Primary**: `https://api.uzaempower.com` (Deployed/Production server)
- **Secondary**: `http://localhost:5000` (Local development server)

### Local Development

```env
NODE_ENV=development
BACKEND_URL=http://localhost:5000
```

Swagger will show:
- **Primary**: `http://localhost:5000` (Local development server)

### Mixed (Development with Production API)

```env
NODE_ENV=development
BACKEND_URL=https://api.uzaempower.com
```

Swagger will show:
- **Primary**: `https://api.uzaempower.com` (Deployed/Production server)
- **Secondary**: `http://localhost:5000` (Local development server)

## Deployment Platforms

### Vercel

```env
BACKEND_URL=https://your-app.vercel.app
```

### Railway

```env
BACKEND_URL=https://your-app.railway.app
```

### Render

```env
BACKEND_URL=https://your-app.onrender.com
```

### AWS/EC2

```env
BACKEND_URL=https://api.yourdomain.com
```

### DigitalOcean

```env
BACKEND_URL=https://your-app.ondigitalocean.app
```

## Verification

After setting `BACKEND_URL`:

1. **Restart your server:**
   ```bash
   npm run dev
   ```

2. **Open Swagger UI:**
   ```
   http://localhost:5000/api-docs
   ```

3. **Check the server dropdown** at the top of Swagger UI
   - You should see your deployed URL listed
   - Select it to use the deployed server

4. **Test an endpoint:**
   - The API calls will go to your deployed server
   - Check the network tab to verify the URL

## Important Notes

⚠️ **CORS Configuration**: Make sure your deployed backend allows requests from where Swagger is hosted

⚠️ **HTTPS**: If your deployed server uses HTTPS, make sure `BACKEND_URL` uses `https://`

⚠️ **Authentication**: Tokens from localhost and deployed server are separate - you'll need to login again for the deployed server

## Troubleshooting

**Swagger still showing localhost?**
- Check that `BACKEND_URL` is set in `.env`
- Restart the server after changing `.env`
- Verify the URL format is correct (include `http://` or `https://`)

**API calls failing?**
- Check CORS settings on deployed server
- Verify the deployed server is accessible
- Check network/firewall settings

**Want to remove localhost option?**
- Edit `backend/src/config/swagger.js`
- Remove the localhost server entry from the `servers` array

