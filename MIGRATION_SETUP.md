## Database Migration Setup Guide

### 🚀 QUICK START (3 Easy Steps)

#### STEP 1: Update Connection String
Edit the file `scripts/check-database.js` and replace this line:
```javascript
const mongoUri = 'mongodb://localhost:27017/your-database';
```

With your actual MongoDB connection string from your .env file.

#### STEP 2: Check Current Database State
Run this command:
```bash
cd scripts
node check-database.js
```

#### STEP 3: Run Migration (when ready)
Run this command:
```bash
node migrate-sections.js
```

### 📋 ALTERNATIVE: Use API Method
If your dev server is running, you can use:
```bash
curl -X POST http://localhost:3000/api/admin/migrate-sections \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate"}'
```

### ⚠️ SAFETY REMINDERS
- Always backup database first
- Test on staging if possible
- Migration takes 5-15 minutes
- Rollback available if needed

### 🆘 NEED HELP?
- Can't find MongoDB string? Check your .env file for MONGODB_URI
- Server not running? Start with `npm run dev`
- Connection issues? Check MongoDB is running

### 📞 Next Steps
1. Update the connection string
2. Run the check script
3. Let me know the results
4. I'll help you proceed safely
