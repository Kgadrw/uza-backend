# Fix MongoDB Connection String

## Quick Fix

Your MongoDB password contains an `@` symbol (`Kigali20@`), which needs to be URL-encoded in the connection string.

### Option 1: Run the fix script (Recommended)

```bash
npm run fix-mongodb
```

This will automatically fix your `.env` file.

### Option 2: Manual Fix

Open your `backend/.env` file and change this line:

**WRONG:**
```env
MONGODB_URI=mongodb+srv://gad:Kigali20@@cluster0.uamtdm9.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
```

**CORRECT:**
```env
MONGODB_URI=mongodb+srv://gad:Kigali20%40@cluster0.uamtdm9.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
```

**The change:** `Kigali20@@` → `Kigali20%40@`

The `@` symbol in the password must be URL-encoded as `%40`.

### After Fixing

1. Save the `.env` file
2. Restart your server:
   ```bash
   npm run dev
   ```

The server should now connect to MongoDB successfully! ✅

