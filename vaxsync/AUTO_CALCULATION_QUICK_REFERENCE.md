# Auto-Calculation Quick Reference

## 🎯 The Formula

```
Ending Inventory = Initial + Supplied - Used - Wastage
```

---

## 📊 What Gets Calculated

| Field | Editable | Calculated |
|-------|----------|------------|
| Initial Inventory | ✅ Yes | ❌ No |
| Quantity Supplied | ✅ Yes | ❌ No |
| Quantity Used | ✅ Yes | ❌ No |
| Quantity Wastage | ✅ Yes | ❌ No |
| **Ending Inventory** | ❌ **No** | ✅ **Yes** |

---

## 🔄 How It Works

### Step 1: Edit Fields
```
You edit: Initial = 1500, Used = 300
```

### Step 2: Real-Time Update
```
Ending automatically updates to: 1650
(Shows in blue, read-only)
```

### Step 3: Switch Month
```
You click: Previous/Next Month
```

### Step 4: Auto-Calculate & Save
```
System calculates: Ending = 1500 + 500 - 300 - 50 = 1650
System saves: All values including calculated ending
```

### Step 5: Database Stores
```
Database saves:
- Initial: 1500
- Supplied: 500
- Used: 300
- Wastage: 50
- Ending: 1650 ✅
```

---

## 💡 Examples

### Example 1: Stock Received
```
Initial:    1000
Supplied: +  500  ← New stock arrived
Used:      -  250
Wastage:   -   50
─────────────────
Ending:    = 1200
```

### Example 2: High Usage
```
Initial:    1000
Supplied: +  200
Used:      -  800  ← Many doses used
Wastage:   -   50
─────────────────
Ending:    =  350
```

### Example 3: Wastage
```
Initial:    1000
Supplied: +  500
Used:      -  250
Wastage:   -  150  ← Damaged doses
─────────────────
Ending:    = 1100
```

---

## ✨ Key Features

- ✅ **Automatic**: No manual calculation needed
- ✅ **Real-Time**: Updates as you type
- ✅ **Accurate**: Formula always correct
- ✅ **Read-Only**: Can't edit ending directly
- ✅ **Consistent**: Database always has correct value

---

## 🎨 Visual Indicator

### Ending Inventory Cell
```
┌─────────────────┐
│  1650           │  ← Blue background
│ (calculated)    │  ← Read-only
└─────────────────┘
```

---

## 🧪 Quick Test

### Test It Now
1. Open Monthly Report
2. Edit Initial Inventory: 1000 → 1500
3. **Watch**: Ending updates automatically
4. Edit Used: 250 → 300
5. **Watch**: Ending updates again
6. Click Next Month
7. **Watch**: Changes save with calculated ending

---

## 🔍 Verify It Works

### Check Real-Time Update
```
Before: Initial=1000, Used=250 → Ending=1200
After:  Initial=1500, Used=250 → Ending=1700
                                 ↑ Updated instantly
```

### Check Save
```
1. Edit cells
2. Switch month
3. Switch back
4. Your ending value should still be there
```

### Check Database
```sql
SELECT 
  initial_inventory,
  quantity_supplied,
  quantity_used,
  quantity_wastage,
  ending_inventory
FROM vaccine_monthly_report
WHERE id = 'your-record-id';

-- Verify: ending = initial + supplied - used - wastage
```

---

## ❓ FAQ

### Q: Can I edit the Ending Inventory?
**A:** No, it's read-only. It's calculated automatically.

### Q: What if I make a mistake?
**A:** Just edit the field again. Ending recalculates automatically.

### Q: Is the calculation saved?
**A:** Yes, when you switch months, the calculated value is saved.

### Q: What if the calculation is wrong?
**A:** Check the formula: Ending = Initial + Supplied - Used - Wastage

### Q: Does it work offline?
**A:** No, it needs internet to save to the database.

---

## 📋 Checklist

- [x] Ending Inventory is read-only
- [x] Ending updates in real-time
- [x] Ending shows in blue
- [x] Ending auto-calculates on save
- [x] Formula is correct
- [x] Database stores calculated value

---

## 🚀 Usage

### For Users
1. Edit Initial, Supplied, Used, or Wastage
2. Watch Ending update automatically
3. Switch months to save
4. Done!

### For Developers
- No setup needed
- Works automatically
- Check console logs for calculations
- Verify database values

---

**Status:** ✅ Ready to Use

**Last Updated:** December 2, 2025
