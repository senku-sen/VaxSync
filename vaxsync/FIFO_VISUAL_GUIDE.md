# FIFO Inventory Deduction - Visual Guide

## Problem Visualization

### ❌ OLD SYSTEM (LIFO - Last-In-First-Out)

```
Scenario: TT1 vaccine with split inventory

Timeline:
┌─────────────────────────────────────────────┐
│ 2025-01-01: Received 100 vials (BATCH001)   │ ← OLDEST
│ 2025-01-05: Received 100 vials (BATCH002)   │ ← NEWEST
└─────────────────────────────────────────────┘

Inventory State:
┌──────────────────────────────────────────────┐
│ Record 1 (BATCH001): 100 vials              │
│ Record 2 (BATCH002): 100 vials              │
└──────────────────────────────────────────────┘

Action: Deduct 200 vials (200 people vaccinated)

OLD SYSTEM (LIFO - Newest First):
  1. Fetch records: Order by created_at DESC (newest first)
  2. Limit to 1 record
  3. Deduct from Record 2 (BATCH002): 100 → -100 ❌ WRONG!
  
Result:
┌──────────────────────────────────────────────┐
│ Record 1 (BATCH001): 100 vials (unused)     │ ← EXPIRED!
│ Record 2 (BATCH002): -100 vials (negative!) │ ← ERROR!
└──────────────────────────────────────────────┘

Problem: Older vaccine expires while newer vaccine is over-deducted!
```

### ✅ NEW SYSTEM (FIFO - First-In-First-Out)

```
Same Scenario: TT1 vaccine with split inventory

Timeline:
┌─────────────────────────────────────────────┐
│ 2025-01-01: Received 100 vials (BATCH001)   │ ← OLDEST
│ 2025-01-05: Received 100 vials (BATCH002)   │ ← NEWEST
└─────────────────────────────────────────────┘

Inventory State:
┌──────────────────────────────────────────────┐
│ Record 1 (BATCH001): 100 vials              │
│ Record 2 (BATCH002): 100 vials              │
└──────────────────────────────────────────────┘

Action: Deduct 200 vials (200 people vaccinated)

NEW SYSTEM (FIFO - Oldest First):
  1. Fetch records: Order by created_at ASC (oldest first)
  2. Fetch ALL records (no limit)
  3. Deduct from Record 1 (BATCH001): 100 → 0 ✅
  4. Deduct from Record 2 (BATCH002): 100 → 0 ✅
  
Result:
┌──────────────────────────────────────────────┐
│ Record 1 (BATCH001): 0 vials (used first)   │ ✅ CORRECT!
│ Record 2 (BATCH002): 0 vials (used second)  │ ✅ CORRECT!
└──────────────────────────────────────────────┘

Benefit: Older vaccine used first, preventing expiry!
```

## Step-by-Step Deduction Process

### Example 1: Simple Deduction

```
Setup:
┌─────────────────────────────────────────┐
│ TT1 Inventory:                          │
│ ├─ Record 1: 100 vials (2025-01-01)    │
│ └─ Record 2: 100 vials (2025-01-05)    │
└─────────────────────────────────────────┘

Action: Deduct 150 vials

Step 1: Fetch records (FIFO - oldest first)
┌─────────────────────────────────────────┐
│ Record 1: 100 vials (2025-01-01) ← 1st │
│ Record 2: 100 vials (2025-01-05) ← 2nd │
└─────────────────────────────────────────┘

Step 2: Process Record 1
  Remaining to deduct: 150
  Available in Record 1: 100
  Deduct from Record 1: 100
  Record 1: 100 → 0 ✅
  Remaining: 150 - 100 = 50

Step 3: Process Record 2
  Remaining to deduct: 50
  Available in Record 2: 100
  Deduct from Record 2: 50
  Record 2: 100 → 50 ✅
  Remaining: 50 - 50 = 0

Result:
┌─────────────────────────────────────────┐
│ Record 1: 0 vials (fully used)          │
│ Record 2: 50 vials (partially used)     │
└─────────────────────────────────────────┘

Console Output:
🔴 FIFO Deducting vaccine from inventory: {
  barangayId: "...",
  vaccineId: "...",
  quantityToDeduct: 150
}

Found 2 inventory record(s) for FIFO deduction:
  { id: "inv-1", quantity_vial: 100, batch: "BATCH001" },
  { id: "inv-2", quantity_vial: 100, batch: "BATCH002" }

  📦 Record inv-1 (Batch: BATCH001): 100 → 0 (deducting 100)
  📦 Record inv-2 (Batch: BATCH002): 100 → 50 (deducting 50)

✅ FIFO Deduction complete. Deducted from 2 record(s)
```

### Example 2: Add-Back Operation

```
Setup:
┌─────────────────────────────────────────┐
│ TT1 Inventory:                          │
│ ├─ Record 1: 50 vials (2025-01-01)     │
│ └─ Record 2: 75 vials (2025-01-05)     │
└─────────────────────────────────────────┘

Action: Add back 25 vials (correction)

Step 1: Fetch records (FIFO - oldest first)
┌─────────────────────────────────────────┐
│ Record 1: 50 vials (2025-01-01) ← 1st  │
│ Record 2: 75 vials (2025-01-05) ← 2nd  │
└─────────────────────────────────────────┘

Step 2: Process Record 1
  Remaining to add: 25
  Add to Record 1: 25
  Record 1: 50 → 75 ✅
  Remaining: 0

Result:
┌─────────────────────────────────────────┐
│ Record 1: 75 vials (restored)           │
│ Record 2: 75 vials (unchanged)          │
└─────────────────────────────────────────┘

Console Output:
🟢 FIFO Adding back vaccine to inventory: {
  barangayId: "...",
  vaccineId: "...",
  quantityToAdd: 25
}

Found 2 inventory record(s) for FIFO add-back:
  { id: "inv-1", quantity_vial: 50, batch: "BATCH001" },
  { id: "inv-2", quantity_vial: 75, batch: "BATCH002" }

  📦 Record inv-1 (Batch: BATCH001): 50 → 75 (adding 25)

✅ FIFO Add-back complete. Added to 1 record(s)
```

## Real-World Scenario

### Health Worker Vaccination Session

```
Timeline:

Day 1 (2025-01-01):
┌──────────────────────────────────────────┐
│ Head Nurse receives TT1 vaccine          │
│ Batch: BATCH001                          │
│ Quantity: 100 vials                      │
│ Expiry: 2025-06-01                       │
└──────────────────────────────────────────┘
  ↓
  Inventory Record 1 created:
  ┌──────────────────────────────────────┐
  │ ID: inv-1                            │
  │ Batch: BATCH001                      │
  │ Quantity: 100 vials                  │
  │ Created: 2025-01-01                  │
  │ Expiry: 2025-06-01                   │
  └──────────────────────────────────────┘

Day 5 (2025-01-05):
┌──────────────────────────────────────────┐
│ Head Nurse receives TT1 vaccine          │
│ Batch: BATCH002                          │
│ Quantity: 100 vials                      │
│ Expiry: 2025-07-01                       │
└──────────────────────────────────────────┘
  ↓
  Inventory Record 2 created:
  ┌──────────────────────────────────────┐
  │ ID: inv-2                            │
  │ Batch: BATCH002                      │
  │ Quantity: 100 vials                  │
  │ Created: 2025-01-05                  │
  │ Expiry: 2025-07-01                   │
  └──────────────────────────────────────┘

Day 10 (2025-01-10):
┌──────────────────────────────────────────┐
│ Health Worker schedules vaccination      │
│ Session: TT1 Vaccination                 │
│ Target: 200 people                       │
│ Barangay: San Jose                       │
└──────────────────────────────────────────┘
  ↓
  Session created with target = 200

Day 15 (2025-01-15):
┌──────────────────────────────────────────┐
│ Health Worker updates session:           │
│ Administered: 0 → 200 people             │
│ (All 200 people vaccinated)              │
└──────────────────────────────────────────┘
  ↓
  FIFO Deduction triggered:
  
  Deduct 200 vials from TT1:
  
  Step 1: Fetch records (oldest first)
    Record 1 (inv-1, BATCH001): 100 vials
    Record 2 (inv-2, BATCH002): 100 vials
  
  Step 2: Deduct from Record 1
    inv-1: 100 → 0 (deducted 100)
    Remaining: 100
  
  Step 3: Deduct from Record 2
    inv-2: 100 → 0 (deducted 100)
    Remaining: 0
  
  ✅ Complete!
  
  Result:
  ┌──────────────────────────────────────┐
  │ Record 1 (BATCH001): 0 vials ✅      │
  │ Record 2 (BATCH002): 0 vials ✅      │
  └──────────────────────────────────────┘
  
  Benefit: Older batch (BATCH001) used first!
           BATCH001 expires 2025-06-01
           BATCH002 expires 2025-07-01
           Older batch used first = No waste!

Day 20 (2025-01-20):
┌──────────────────────────────────────────┐
│ Health Worker corrects session:          │
│ Administered: 200 → 180 people           │
│ (Correction: 20 fewer people)            │
└──────────────────────────────────────────┘
  ↓
  FIFO Add-Back triggered:
  
  Add back 20 vials to TT1:
  
  Step 1: Fetch records (oldest first)
    Record 1 (inv-1, BATCH001): 0 vials
    Record 2 (inv-2, BATCH002): 0 vials
  
  Step 2: Add back to Record 1
    inv-1: 0 → 20 (added 20)
    Remaining: 0
  
  ✅ Complete!
  
  Result:
  ┌──────────────────────────────────────┐
  │ Record 1 (BATCH001): 20 vials ✅     │
  │ Record 2 (BATCH002): 0 vials ✅      │
  └──────────────────────────────────────┘
  
  Benefit: Restored to oldest batch first!
           Maintains FIFO principle!
```

## Comparison Table

| Aspect | OLD (LIFO) | NEW (FIFO) |
|--------|-----------|-----------|
| **Sort Order** | Newest first ❌ | Oldest first ✅ |
| **Records** | 1 only ❌ | All records ✅ |
| **Split Inventory** | Fails ❌ | Works ✅ |
| **Batch Tracking** | Limited ❌ | Full tracking ✅ |
| **Expiry Prevention** | No ❌ | Yes ✅ |
| **Error Handling** | Basic ❌ | Detailed ✅ |
| **Logging** | Minimal ❌ | Detailed ✅ |
| **Compliance** | Poor ❌ | Good ✅ |

## Console Log Visualization

### Deduction Operation

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 FIFO Deducting vaccine from inventory: {                │
│   barangayId: "barangay-123",                              │
│   vaccineId: "vaccine-456",                                │
│   quantityToDeduct: 200                                    │
│ }                                                           │
│                                                             │
│ Found 2 inventory record(s) for FIFO deduction:            │
│   { id: "inv-1", quantity_vial: 100, batch: "BATCH001" }, │
│   { id: "inv-2", quantity_vial: 100, batch: "BATCH002" }  │
│                                                             │
│   📦 Record inv-1 (Batch: BATCH001):                       │
│      100 → 0 (deducting 100)                              │
│   📦 Record inv-2 (Batch: BATCH002):                       │
│      100 → 0 (deducting 100)                              │
│                                                             │
│ ✅ FIFO Deduction complete.                               │
│    Deducted from 2 record(s):                             │
│    [                                                        │
│      {                                                      │
│        id: "inv-1",                                        │
│        batch_number: "BATCH001",                           │
│        previousQuantity: 100,                              │
│        deductedQuantity: 100,                              │
│        newQuantity: 0                                      │
│      },                                                     │
│      {                                                      │
│        id: "inv-2",                                        │
│        batch_number: "BATCH002",                           │
│        previousQuantity: 100,                              │
│        deductedQuantity: 100,                              │
│        newQuantity: 0                                      │
│      }                                                      │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Add-Back Operation

```
┌─────────────────────────────────────────────────────────────┐
│ 🟢 FIFO Adding back vaccine to inventory: {                │
│   barangayId: "barangay-123",                              │
│   vaccineId: "vaccine-456",                                │
│   quantityToAdd: 25                                        │
│ }                                                           │
│                                                             │
│ Found 2 inventory record(s) for FIFO add-back:             │
│   { id: "inv-1", quantity_vial: 50, batch: "BATCH001" },  │
│   { id: "inv-2", quantity_vial: 75, batch: "BATCH002" }   │
│                                                             │
│   📦 Record inv-1 (Batch: BATCH001):                       │
│      50 → 75 (adding 25)                                  │
│                                                             │
│ ✅ FIFO Add-back complete.                                │
│    Added to 1 record(s):                                  │
│    [                                                        │
│      {                                                      │
│        id: "inv-1",                                        │
│        batch_number: "BATCH001",                           │
│        previousQuantity: 50,                               │
│        addedQuantity: 25,                                  │
│        newQuantity: 75                                     │
│      }                                                      │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Takeaways

### ✅ FIFO Ensures:
1. **Older vaccines used first** → Prevents expiry
2. **Proper batch rotation** → Maintains compliance
3. **Accurate tracking** → Full audit trail
4. **Multiple records handled** → Split inventory works
5. **Detailed logging** → Easy debugging

### ✅ Benefits:
- 🏥 Healthcare compliance
- 📊 Accurate inventory
- 🔍 Easy debugging
- ⚠️ Proper error handling
- 💼 Professional tracking

### ✅ No Breaking Changes:
- Function signatures same
- Return types compatible
- Backward compatible
- Existing code works
- Seamless upgrade
