# MongoDB Connection String Fix

## Issues with Your Current Connection String

Your connection string:
```
mongodb+srv://kalisagad05_db_user:<Kigali20@>@cluster0.m99anbz.mongodb.net/?appName=Cluster0
```

**Problems:**
1. ❌ Angle brackets `<Kigali20@>` - these should NOT be in the connection string
2. ❌ The `@` in password needs to be URL-encoded as `%40`
3. ❌ No database name specified (should be `/test` or your database name)
4. ❌ Missing important connection options

## Corrected Connection String

**Option 1: Using 'test' database (as you mentioned earlier)**
```env
MONGODB_URI=mongodb+srv://kalisagad05_db_user:Kigali20%40@cluster0.m99anbz.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
```

**Option 2: Using 'uzaempower' database (recommended)**
```env
MONGODB_URI=mongodb+srv://kalisagad05_db_user:Kigali20%40@cluster0.m99anbz.mongodb.net/uzaempower?retryWrites=true&w=majority&appName=Cluster0
```

## Key Changes:
1. ✅ Removed angle brackets: `<Kigali20@>` → `Kigali20@`
2. ✅ URL-encoded the `@` in password: `Kigali20@` → `Kigali20%40`
3. ✅ Added database name: `/test` or `/uzaempower`
4. ✅ Added connection options: `?retryWrites=true&w=majority`

## Update Your .env File

Replace the `MONGODB_URI` line in your `backend/.env` file with one of the corrected versions above.

## Verify Connection

After updating, restart your server:
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

