# Barangay Vaccine Inventory Schema

## Overview
The `barangay_vaccine_inventory` table tracks vaccine stock levels for each barangay, enabling inventory management and monitoring of vaccine availability.

---

## Database Schema

### Table: `barangay_vaccine_inventory`

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

-- Create indexes for faster queries
CREATE INDEX idx_barangay_vaccine_inventory_barangay_id 
  ON public.barangay_vaccine_inventory(barangay_id);
CREATE INDEX idx_barangay_vaccine_inventory_vaccine_id 
  ON public.barangay_vaccine_inventory(vaccine_id);
CREATE INDEX idx_barangay_vaccine_inventory_expiry_date 
  ON public.barangay_vaccine_inventory(expiry_date);
```

---

## Column Definitions

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | UUID | Unique inventory record identifier | ✅ |
| `barangay_id` | UUID | Reference to barangay | ✅ |
| `vaccine_id` | UUID | Reference to vaccine | ✅ |
| `quantity_vial` | INTEGER | Number of vials in stock | ✅ |
| `quantity_dose` | INTEGER | Number of doses in stock | ✅ |
| `batch_number` | VARCHAR(255) | Vaccine batch number for tracking | ❌ |
| `expiry_date` | DATE | Vaccine expiration date | ❌ |
| `received_date` | TIMESTAMP | Date vaccine was received | ✅ |
| `updated_at` | TIMESTAMP | Last update timestamp | ✅ |
| `notes` | TEXT | Additional notes (storage location, etc.) | ❌ |
| `created_at` | TIMESTAMP | Record creation timestamp | ✅ |

---

## RLS Policies

### For Health Workers
```sql
-- Health Workers can only READ inventory for their assigned barangay
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

### For Head Nurse (Admin)
```sql
-- Head Nurse can READ all inventory
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

-- Head Nurse can INSERT inventory
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

-- Head Nurse can UPDATE inventory
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

-- Head Nurse can DELETE inventory
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

## Library Functions

### File: `/lib/barangayVaccineInventory.js`

#### 1. **fetchBarangayVaccineInventory(barangayId)**
Fetch all vaccine inventory for a barangay.

```javascript
const { data, error } = await fetchBarangayVaccineInventory(barangayId);
// Returns: Array of inventory records with vaccine details
```

#### 2. **getBarangayVaccineTotal(barangayId, vaccineId)**
Get total quantity of a specific vaccine in a barangay.

```javascript
const { total, error } = await getBarangayVaccineTotal(barangayId, vaccineId);
// Returns: { total: 50, error: null }
```

#### 3. **addBarangayVaccineInventory(inventoryData)**
Add new vaccine stock to barangay inventory.

```javascript
const { data, error } = await addBarangayVaccineInventory({
  barangay_id: "uuid",
  vaccine_id: "uuid",
  quantity_vial: 10,
  quantity_dose: 100,
  batch_number: "BATCH123",
  expiry_date: "2025-12-31",
  notes: "Stored in cold storage"
});
```

#### 4. **updateBarangayVaccineInventory(inventoryId, quantityVial, quantityDose)**
Update quantity for an inventory record.

```javascript
const { data, error } = await updateBarangayVaccineInventory(
  inventoryId,
  8,  // new quantity vials
  80  // new quantity doses
);
```

#### 5. **deductBarangayVaccineInventory(barangayId, vaccineId, quantityToDeduct)**
Deduct vaccine from inventory (when administered).

```javascript
const { success, error } = await deductBarangayVaccineInventory(
  barangayId,
  vaccineId,
  2  // deduct 2 vials
);
```

#### 6. **getLowStockVaccines(barangayId, threshold)**
Get vaccines below a certain stock level.

```javascript
const { data, error } = await getLowStockVaccines(barangayId, 5);
// Returns: Array of low stock vaccines (< 5 vials)
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
  console.error('Failed to add inventory:', result.error);
} else {
  console.log('Inventory added:', result.data);
}
```

### Example 2: Check Stock Level
```javascript
import { getBarangayVaccineTotal } from '@/lib/barangayVaccineInventory';

const { total } = await getBarangayVaccineTotal(barangayId, vaccineId);
console.log(`Available vials: ${total}`);

if (total < 5) {
  console.warn('Low stock alert!');
}
```

### Example 3: Deduct After Administration
```javascript
import { deductBarangayVaccineInventory } from '@/lib/barangayVaccineInventory';

const { success, error } = await deductBarangayVaccineInventory(
  barangayId,
  vaccineId,
  1  // 1 vial administered
);

if (success) {
  console.log('Inventory updated');
}
```

### Example 4: Monitor Low Stock
```javascript
import { getLowStockVaccines } from '@/lib/barangayVaccineInventory';

const { data: lowStockVaccines } = await getLowStockVaccines(barangayId, 5);

lowStockVaccines.forEach(item => {
  console.log(`⚠️ ${item.vaccine.name}: ${item.quantity_vial} vials remaining`);
});
```

---

## Data Relationships

```
barangays (1) ──→ (many) barangay_vaccine_inventory
vaccines (1) ──→ (many) barangay_vaccine_inventory
vaccine_requests (1) ──→ (many) barangay_vaccine_inventory
```

---

## Key Features

✅ **Inventory Tracking** - Monitor vaccine stock per barangay
✅ **Batch Management** - Track batch numbers and expiry dates
✅ **Stock Alerts** - Identify low stock vaccines
✅ **Deduction Tracking** - Automatic deduction when vaccines administered
✅ **Audit Trail** - Timestamps for all changes
✅ **Role-Based Access** - Health Workers see only their barangay, Head Nurse sees all
✅ **Relationship Queries** - Fetch vaccine details with inventory

---

## Implementation Steps

1. **Create table in Supabase:**
   - Run the SQL schema in Supabase SQL Editor
   - Enable RLS on the table

2. **Apply RLS Policies:**
   - Create policies for Health Workers (read own barangay)
   - Create policies for Head Nurse (read/write all)

3. **Use Library Functions:**
   - Import functions from `/lib/barangayVaccineInventory.js`
   - Use in components and pages

4. **Monitor Inventory:**
   - Display current stock in barangay dashboard
   - Show low stock alerts
   - Track deductions after vaccination sessions

---

## Common Queries

### Get all vaccines for a barangay with current stock
```javascript
const { data } = await fetchBarangayVaccineInventory(barangayId);
// Shows: vaccine name, batch, expiry, quantity
```

### Find expired vaccines
```javascript
const { data } = await supabase
  .from('barangay_vaccine_inventory')
  .select('*')
  .lt('expiry_date', new Date().toISOString());
```

### Get total doses available
```javascript
const { data } = await supabase
  .from('barangay_vaccine_inventory')
  .select('quantity_dose')
  .eq('barangay_id', barangayId);

const totalDoses = data.reduce((sum, item) => sum + item.quantity_dose, 0);
```

---

## Notes

- **Quantity Units:** Vials and doses are tracked separately for flexibility
- **Batch Tracking:** Important for vaccine recalls and quality control
- **Expiry Management:** Helps prevent use of expired vaccines
- **Audit Trail:** All changes timestamped for accountability
- **Cascading Deletes:** Deleting a barangay/vaccine removes related inventory records
