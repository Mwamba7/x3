# Database Section Migration Guide

## Overview
This guide helps you safely migrate your existing products to be organized by sections (Collection, Fashion, Pre-owned, Marketplace) without breaking the website.

## Current Structure Analysis

### How Products Are Currently Separated:
1. **Collection** - Electronics categories: `['tv','radio','phone','electronics','accessory','appliances','fridge','cooler']`
2. **Fashion** - Fashion categories: `['outfits', 'hoodie', 'shoes', 'sneakers', 'ladies', 'men']`
3. **Pre-owned** - Categories starting with "preowned" (regex pattern)
4. **Marketplace** - Products with `metadata.source: 'sell-page'` and `metadata.submissionType: 'public'`

## Migration Strategy

### Phase 1: Preparation ⚠️ **CRITICAL**
1. **BACKUP YOUR DATABASE** before proceeding
2. Test migration on a staging environment first
3. Schedule maintenance window (estimated 5-15 minutes)

### Phase 2: Safe Migration Process

#### Step 1: Add Section Field to Model
- The new `section` field is added with a default value of 'collection'
- This ensures backward compatibility
- Existing products will automatically get the correct section assigned

#### Step 2: Run Migration Script
```bash
# Option 1: Run via API (recommended)
curl -X POST http://localhost:3000/api/admin/migrate-sections \
  -H "Content-Type: application/json" \
  -d '{"action": "migrate"}' \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Option 2: Run directly (for development)
cd scripts
node migrate-sections.js
```

#### Step 3: Verification
- Check that all products have the correct section assigned
- Verify website functionality works normally
- Test all sections (Collection, Fashion, Pre-owned, Marketplace)

### Phase 3: Update Application Code

#### Update API Endpoints
- New dedicated endpoints for each section:
  - `/api/products/collection` - Collection products only
  - `/api/products/fashion` - Fashion products only
  - `/api/products/preowned` - Pre-owned products only
  - `/api/products/marketplace` - Marketplace products only

#### Update Frontend Components
- Modify components to use new section-based APIs
- This provides better performance and clearer separation

### Phase 4: Rollback Plan (if needed)
```bash
# Rollback via API
curl -X POST http://localhost:3000/api/admin/migrate-sections \
  -H "Content-Type: application/json" \
  -d '{"action": "rollback"}' \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Files Created/Modified

### New Files:
1. `scripts/migrate-sections.js` - Migration script
2. `models/Product-with-section.js` - Updated product model
3. `app/api/products/collection/route.js` - Collection API
4. `app/api/products/fashion/route.js` - Fashion API
5. `app/api/products/preowned/route.js` - Pre-owned API
6. `app/api/products/marketplace/route.js` - Marketplace API
7. `app/api/admin/migrate-sections/route.js` - Migration control API

### Files to Update (after successful migration):
1. `models/Product.js` - Replace with Product-with-section.js
2. `app/page.jsx` - Update to use section-based queries
3. `app/marketplace/page.jsx` - Update to use section-based queries
4. Various client components - Update to use new APIs

## Benefits of This Approach

### Safety:
- ✅ No data loss
- ✅ Backward compatible
- ✅ Rollback capability
- ✅ Gradual migration possible

### Performance:
- ✅ Faster queries (indexed section field)
- ✅ Cleaner code separation
- ✅ Better scalability

### Maintenance:
- ✅ Clear product organization
- ✅ Easier to add new sections
- ✅ Better analytics capabilities

## Testing Checklist

### Before Migration:
- [ ] Database backup completed
- [ ] All current functionality working
- [ ] Performance benchmarks recorded

### After Migration:
- [ ] All products have correct section assigned
- [ ] Website loads without errors
- [ ] All sections display correct products
- [ ] Search and filtering work
- [ ] Admin functionality works
- [ ] Cart functionality works
- [ ] Mobile responsiveness maintained

### Performance Verification:
- [ ] Page load times acceptable
- [ ] API response times improved
- [ ] Database queries optimized

## Troubleshooting

### Common Issues:
1. **Products in wrong section** - Re-run migration script
2. **Missing section field** - Check model update
3. **API errors** - Verify new endpoints are working
4. **Performance issues** - Check database indexes

### Emergency Rollback:
If critical issues occur, immediately run the rollback and restore from backup if needed.

## Support
For issues during migration, check:
1. Browser console for JavaScript errors
2. Server logs for database errors
3. Network tab for API failures
4. Database directly for data integrity
