# Vaccine Request Validation & Inventory System - Implementation Guide

## Quick Start

This guide explains the new vaccine request validation system and barangay vaccine inventory tracking.

---

## What's New

### 1. Vaccine Request Modal Validation
When adding a vaccine request, the system now:
- ✅ Validates the vaccine.id exists in database
- ✅ Checks if vaccine has approved requests
- ✅ Verifies vaccine is not expired
- ✅ Shows max quantity_vial from approved requests
- ✅ Prevents submission if vaccine is invalid

### 2. Barangay Vaccine Inventory
New system to track vaccine stock per barangay:
- ✅ Monitor how many vaccines are in each barangay
- ✅ Track batch numbers and expiry dates
- ✅ Automatic deduction when vaccines administered
- ✅ Low stock alerts
- ✅ Audit trail with timestamps

---

## Files Created

### 1. `/lib/vaccineRequestValidation.js`
Validation functions for vaccine requests.

**Key Functions:**
```javascript
// Check if vaccine has approved requests
checkApprovedVaccineRequests(vaccineId, barangayId)

// Get max quantity_vial from approved requests
getMaxApprovedVaccineQuantity(vaccineId, barangayId)

// Comprehensive vaccine validation
validateVaccineForSession(vaccineId, barangayId)

// Get approved request details
getApprovedVaccineRequestDetails(vaccineId, barangayId)
```

### 2. `/lib/barangayVaccineInventory.js`
Inventory management functions.

**Key Functions:**
```javascript
// Fetch all inventory for a barangay
fetchBarangayVaccineInventory(barangayId)

// Get total of specific vaccine
getBarangayVaccineTotal(barangayId, vaccineId)

// Add new vaccine stock
addBarangayVaccineInventory(inventoryData)

// Update quantities
updateBarangayVaccineInventory(inventoryId, quantityVial, quantityDose)

// Deduct when administered
deductBarangayVaccineInventory(barangayId, vaccineId, quantityToDeduct)

// Find low stock vaccines
getLowStockVaccines(barangayId, threshold)
```

### 3. `/BARANGAY_VACCINE_INVENTORY_SCHEMA.md`
Complete database schema and documentation.

---

## How It Works

### Vaccine Request Modal Flow

```
User opens "New Request" modal
    ↓
Selects vaccine from dropdown
    ↓
System validates vaccine:
  - Checks vaccine.id exists
  - Checks for approved requests
  - Checks expiry date
  - Gets max quantity_vial
    ↓
Shows validation status:
  - ✅ Green: Valid (shows max quantity)
  - ⚠️ Amber: Issues (shows problems)
  - ❌ Red: Invalid (prevents submission)
    ↓
User enters quantity_dose and quantity_vial
    ↓
System validates quantities:
  - quantity_dose must be > 0
  - quantity_vial cannot exceed max approved
    ↓
User submits
    ↓
Request created with vaccine.id
```

### Inventory Tracking Flow

```
Head Nurse receives vaccines
    ↓
Adds to barangay inventory:
  addBarangayVaccineInventory({
    barangay_id: "...",
    vaccine_id: "...",
    quantity_vial: 20,
    quantity_dose: 200,
    batch_number: "BATCH123",
    expiry_date: "2026-06-30"
  })
    ↓
Inventory recorded in database
    ↓
Health Worker administers vaccines
    ↓
System deducts from inventory:
  deductBarangayVaccineInventory(
    barangayId,
    vaccineId,
    1  // 1 vial used
  )
    ↓
Inventory updated automatically
    ↓
Low stock alert if < threshold
```

---

## Database Setup

### Step 1: Create Table

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS public.barangay_vaccine_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  quantity_vial INTEGER NOT NULL DEFAULT 0,
  quantity_dose INTEGER NOT NULL DEFAULT 0,
  batch_number VARCHAR(255),
  expiry_date DATE,
  received_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_barangay_vaccine_inventory_barangay_id 
  ON public.barangay_vaccine_inventory(barangay_id);
CREATE INDEX idx_barangay_vaccine_inventory_vaccine_id 
  ON public.barangay_vaccine_inventory(vaccine_id);
CREATE INDEX idx_barangay_vaccine_inventory_expiry_date 
  ON public.barangay_vaccine_inventory(expiry_date);
```

### Step 2: Enable RLS

In Supabase Dashboard:
1. Go to `barangay_vaccine_inventory` table
2. Click "Enable RLS"
3. Create policies (see below)

### Step 3: Create RLS Policies

**For Health Workers (read own barangay):**
```sql
CREATE POLICY "Health Worker can read own barangay inventory"
ON public.barangay_vaccine_inventory
FOR SELECT
USING (
  barangay_id IN (
    SELECT assigned_barangay_id FROM public.user_profiles
    WHERE id = auth.uid()
  )
);
```

**For Head Nurse (read/write all):**
```sql
CREATE POLICY "Head Nurse can read all inventory"
ON public.barangay_vaccine_inventory
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND user_role = 'Head Nurse'
  )
);

CREATE POLICY "Head Nurse can insert inventory"
ON public.barangay_vaccine_inventory
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND user_role = 'Head Nurse'
  )
);

CREATE POLICY "Head Nurse can update inventory"
ON public.barangay_vaccine_inventory
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND user_role = 'Head Nurse'
  )
);

CREATE POLICY "Head Nurse can delete inventory"
ON public.barangay_vaccine_inventory
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND user_role = 'Head Nurse'
  )
);
```

---

## Usage Examples

### Example 1: Add Vaccine to Inventory

```javascript
import { addBarangayVaccineInventory } from '@/lib/barangayVaccineInventory';

const result = await addBarangayVaccineInventory({
  barangay_id: "barangay-uuid",
  vaccine_id: "vaccine-uuid",
  quantity_vial: 20,
  quantity_dose: 200,
  batch_number: "BATCH2025001",
  expiry_date: "2026-06-30",
  notes: "Received from provincial health office"
});

if (result.error) {
  console.error('Failed:', result.error);
} else {
  console.log('Added:', result.data);
}
```

### Example 2: Check Stock Level

```javascript
import { getBarangayVaccineTotal } from '@/lib/barangayVaccineInventory';

const { total } = await getBarangayVaccineTotal(barangayId, vaccineId);
console.log(`Available: ${total} vials`);

if (total < 5) {
  alert('Low stock alert!');
}
```

### Example 3: Deduct After Administration

```javascript
import { deductBarangayVaccineInventory } from '@/lib/barangayVaccineInventory';

const { success, error } = await deductBarangayVaccineInventory(
  barangayId,
  vaccineId,
  1  // 1 vial used
);

if (success) {
  console.log('Inventory updated');
}
```

### Example 4: Find Low Stock

```javascript
import { getLowStockVaccines } from '@/lib/barangayVaccineInventory';

const { data: lowStock } = await getLowStockVaccines(barangayId, 5);

lowStock.forEach(item => {
  console.log(`⚠️ ${item.vaccine.name}: ${item.quantity_vial} vials`);
});
```

---

## Vaccine Request Modal Changes

The modal now shows:

1. **Vaccine Selection**
   - Dropdown with all available vaccines
   - Real-time validation on selection

2. **Validation Status**
   - ✅ Green box: "Vaccine is valid" + max quantity
   - ⚠️ Amber box: Issues (expired, no approved requests)
   - ❌ Red box: Errors (not found, invalid)

3. **Loading Indicator**
   - Spinner while validating
   - Prevents premature submission

4. **Quantity Fields**
   - quantity_dose (required)
   - quantity_vial (optional, but validated against max)

5. **Error Messages**
   - Clear feedback on what's wrong
   - Prevents invalid submissions

---

## Key Points

### Vaccine ID Validation
- ✅ Uses `vaccine.id` for all operations
- ✅ Validates vaccine exists in database
- ✅ Checks vaccine is not expired
- ✅ Verifies approved requests exist

### Quantity Validation
- ✅ `quantity_vial` max from approved requests
- ✅ `quantity_dose` must be > 0
- ✅ Prevents exceeding approved amount
- ✅ Shows max to user

### Inventory Tracking
- ✅ Tracks per barangay
- ✅ Tracks batch numbers
- ✅ Tracks expiry dates
- ✅ Automatic deduction
- ✅ Low stock alerts

### Access Control
- ✅ Health Workers: See only their barangay
- ✅ Head Nurse: See all barangays
- ✅ Role-based RLS policies
- ✅ Secure data access

---

## Testing Checklist

- [ ] Create barangay_vaccine_inventory table
- [ ] Enable RLS on table
- [ ] Create RLS policies
- [ ] Test vaccine selection in modal
- [ ] Verify validation messages appear
- [ ] Test quantity validation
- [ ] Submit vaccine request
- [ ] Add vaccine to inventory
- [ ] Check stock level
- [ ] Deduct vaccine
- [ ] Verify low stock alert

---

## Troubleshooting

### Validation not showing
- Check if `vaccineRequestValidation.js` is imported
- Verify vaccine has approved requests
- Check console for errors

### Inventory not updating
- Verify RLS policies are created
- Check user role (Head Nurse needed for write)
- Ensure barangay_id and vaccine_id are valid UUIDs

### Low stock not alerting
- Check threshold value (default: 5 vials)
- Verify inventory quantity is below threshold
- Check RLS policies allow read access

---

## Next Steps

1. Create the database table
2. Enable RLS and create policies
3. Test vaccine request modal
4. Create inventory management page
5. Add low stock alerts
6. Integrate with vaccination sessions
