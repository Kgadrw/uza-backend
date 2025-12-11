const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Check if .env file exists
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('Please create the .env file first. See SETUP_ENV.md for instructions.');
  process.exit(1);
}

// Read .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if MongoDB URI has double @
if (envContent.includes('Kigali20@@')) {
  console.log('🔧 Fixing MongoDB connection string...');
  
  // Replace double @ with URL-encoded @
  envContent = envContent.replace(
    /MONGODB_URI=mongodb\+srv:\/\/gad:Kigali20@@cluster0/g,
    'MONGODB_URI=mongodb+srv://gad:Kigali20%40@cluster0'
  );
  
  // Write back to .env file
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  console.log('✅ Fixed! MongoDB connection string updated.');
  console.log('   Changed: Kigali20@@ → Kigali20%40@');
  console.log('\n📝 Please restart your server: npm run dev');
} else if (envContent.includes('Kigali20%40@')) {
  console.log('✅ MongoDB connection string is already correct!');
} else {
  console.log('⚠️  Could not find MongoDB URI with password Kigali20@');
  console.log('   Please check your .env file manually.');
}

