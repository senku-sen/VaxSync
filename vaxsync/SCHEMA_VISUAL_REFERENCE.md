# VaxSync Database - Visual Reference

---

## 📊 Table Structure Overview

### user_profiles
```
┌─────────────────────────────────────────────────┐
│ user_profiles                                   │
├─────────────────────────────────────────────────┤
│ id (UUID) ← auth.users.id                       │
│ first_name (VARCHAR)                            │
│ last_name (VARCHAR)                             │
│ email (VARCHAR, UNIQUE)                         │
│ date_of_birth (DATE)                            │
│ sex (VARCHAR)                                   │
│ address (TEXT)                                  │
│ user_role (VARCHAR) ← "Health Worker"/"Head N" │
│ auth_code (VARCHAR)                             │
│ assigned_barangay_id (UUID) → barangays.id     │
│ created_at (TIMESTAMP)                          │
│ updated_at (TIMESTAMP)                          │
└─────────────────────────────────────────────────┘
```

### barangays
```
┌─────────────────────────────────────────────────┐
│ barangays                                       │
├─────────────────────────────────────────────────┤
│ id (UUID)                                       │
│ name (VARCHAR, UNIQUE)                          │
│ municipality (VARCHAR) ← default: "Daet"        │
│ population (INTEGER)                            │
│ assigned_health_worker (UUID) → user_profiles  │
│ created_at (TIMESTAMP)                          │
└─────────────────────────────────────────────────┘
```

### vaccines
```
┌─────────────────────────────────────────────────┐
│ vaccines                                        │
├─────────────────────────────────────────────────┤
│ id (UUID)                                       │
│ name (VARCHAR)                                  │
│ batch_number (VARCHAR)                          │
│ quantity_available (INTEGER)                    │
│ expiry_date (DATE)                              │
│ created_at (TIMESTAMP)                          │
│ location (VARCHAR)                              │
│ notes (TEXT)                                    │
│ status (VARCHAR) ← "Active"/"Inactive"          │
└─────────────────────────────────────────────────┘
```

### vaccine_requests ⚠️ CRITICAL
```
┌──────────────────────────────────────────────────┐
│ vaccine_requests                                 │
├──────────────────────────────────────────────────┤
│ id (UUID)                                        │
│ barangay_id (UUID) → barangays.id               │
│ vaccine_id (UUID) → vaccines.id                 │
│ requested_by (UUID) → user_profiles.id ⚠️       │
│ quantity_dose (INTEGER)                         │
│ quantity_vial (INTEGER)                         │
│ status (VARCHAR) ← pending/approved/rejected    │
│ created_at (TIMESTAMP)                          │
│ requested_at (TIMESTAMP)                        │
│ notes (TEXT)                                    │
│ request_code (VARCHAR)                          │
└──────────────────────────────────────────────────┘
```

### barangay_vaccine_inventory
```
┌──────────────────────────────────────────────────┐
│ barangay_vaccine_inventory                       │
├──────────────────────────────────────────────────┤
│ id (UUID)                                        │
│ barangay_id (UUID) → barangays.id               │
│ vaccine_id (UUID) → vaccines.id                 │
│ quantity_vial (INTEGER)                         │
│ quantity_dose (INTEGER)                         │
│ batch_number (VARCHAR)                          │
│ expiry_date (DATE)                              │
│ reserved_vial (INTEGER)                         │
│ notes (TEXT)                                    │
│ received_date (TIMESTAMP)                       │
│ created_at (TIMESTAMP)                          │
│ updated_at (TIMESTAMP)                          │
└──────────────────────────────────────────────────┘
```

### vaccination_sessions
```
┌──────────────────────────────────────────────────┐
│ vaccination_sessions                             │
├──────────────────────────────────────────────────┤
│ id (UUID)                                        │
│ barangay_id (UUID) → barangays.id               │
│ vaccine_id (UUID) → vaccines.id                 │
│ session_date (DATE)                             │
│ session_time (TIME)                             │
│ target (INTEGER)                                │
│ administered (INTEGER)                          │
│ status (VARCHAR) ← Scheduled/In progress/Done   │
│ created_by (UUID) → user_profiles.id            │
│ created_at (TIMESTAMP)                          │
│ updated_at (TIMESTAMP)                          │
└──────────────────────────────────────────────────┘
```

---

## 🔗 Relationship Diagram

```
                    ┌─────────────────┐
                    │   auth.users    │
                    │   (Supabase)    │
                    └────────┬────────┘
                             │
                             │ id
                             ▼
                    ┌─────────────────┐
                    │ user_profiles   │
                    ├─────────────────┤
                    │ id (PK)         │
                    │ email           │
                    │ user_role       │
                    │ assigned_       │
                    │ barangay_id (FK)│
                    └────┬────────┬───┘
                         │        │
                    ┌────┘        └──────┐
                    │                    │
                    │ assigned_          │ requested_by
                    │ barangay_id        │ created_by
                    ▼                    ▼
        ┌──────────────────┐    ┌──────────────────────┐
        │   barangays      │    │ vaccine_requests     │
        ├──────────────────┤    ├──────────────────────┤
        │ id (PK)          │    │ id (PK)              │
        │ name             │    │ barangay_id (FK) ──┐│
        │ municipality     │    │ vaccine_id (FK)  ──┼┼─┐
        │ population       │    │ requested_by (FK)  ││ │
        │ assigned_        │    │ quantity_dose       ││ │
        │ health_worker(FK)│    │ status              ││ │
        └────┬─────────────┘    └──────────────────────┘│
             │                                           │
             │ barangay_id                               │
             │ vaccine_id                                │
             ▼                                           │
        ┌──────────────────────────┐                    │
        │ barangay_vaccine_        │                    │
        │ inventory                │                    │
        ├──────────────────────────┤                    │
        │ id (PK)                  │                    │
        │ barangay_id (FK)         │                    │
        │ vaccine_id (FK)          │                    │
        │ quantity_vial            │                    │
        │ quantity_dose            │                    │
        └──────────────────────────┘                    │
                                                         │
        ┌──────────────────────────┐                    │
        │ vaccination_sessions     │                    │
        ├──────────────────────────┤                    │
        │ id (PK)                  │                    │
        │ barangay_id (FK)         │                    │
        │ vaccine_id (FK) ◄────────┼────────────────────┘
        │ created_by (FK)          │
        │ session_date             │
        │ target                   │
        │ administered             │
        │ status                   │
        └──────────────────────────┘

        ┌──────────────────────────┐
        │     vaccines             │
        ├──────────────────────────┤
        │ id (PK)                  │
        │ name                     │
        │ batch_number             │
        │ quantity_available       │
        │ expiry_date              │
        │ status                   │
        └──────────────────────────┘
```

---

## 🔐 RLS Permission Matrix

### Health Worker Access

```
┌──────────────────────┬─────┬─────┬─────┬─────┐
│ Table                │ R   │ C   │ U   │ D   │
├──────────────────────┼─────┼─────┼─────┼─────┤
│ user_profiles        │ OWN │ ✗   │ OWN │ ✗   │
│ barangays            │ ALL │ ✗   │ ✗   │ ✗   │
│ vaccines             │ ALL │ ✗   │ ✗   │ ✗   │
│ vaccine_requests     │ OWN │ OWN │ OWN │ OWN │
│ barangay_vaccine_    │ OWN │ ✗   │ OWN │ ✗   │
│ inventory            │     │     │     │     │
│ vaccination_sessions │ ALL │ ALL │ ALL │ ALL │
└──────────────────────┴─────┴─────┴─────┴─────┘

Legend: R=Read, C=Create, U=Update, D=Delete
        OWN=Own records only, ALL=All records, ✗=No access
```

### Head Nurse Access

```
┌──────────────────────┬─────┬─────┬─────┬─────┐
│ Table                │ R   │ C   │ U   │ D   │
├──────────────────────┼─────┼─────┼─────┼─────┤
│ user_profiles        │ ALL │ ✗   │ ALL │ ✗   │
│ barangays            │ ALL │ ALL │ ALL │ ALL │
│ vaccines             │ ALL │ ALL │ ALL │ ALL │
│ vaccine_requests     │ ALL │ ✗   │ ALL │ ALL │
│ barangay_vaccine_    │ ALL │ ALL │ ALL │ ALL │
│ inventory            │     │     │     │     │
│ vaccination_sessions │ ALL │ ALL │ ALL │ ALL │
└──────────────────────┴─────┴─────┴─────┴─────┘
```

---

## 📈 Data Flow Diagrams

### Vaccine Request Workflow

```
┌─────────────────────────────────────────────────────┐
│ Health Worker Creates Vaccine Request               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ vaccine_requests     │
        │ status: "pending"    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Head Nurse Reviews   │
        │ Request              │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   ┌─────────────┐      ┌──────────────┐
   │ APPROVED    │      │ REJECTED     │
   │ status:     │      │ status:      │
   │ "approved"  │      │ "rejected"   │
   └──────┬──────┘      └──────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Auto-create inventory record│
   │ in barangay_vaccine_        │
   │ inventory table             │
   └──────┬──────────────────────┘
          │
          ▼
   ┌─────────────────────────────┐
   │ Update status to "released" │
   │ Ready for use               │
   └─────────────────────────────┘
```

### Vaccination Session Workflow

```
┌──────────────────────────────────────────────┐
│ Health Worker Creates Vaccination Session    │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │ vaccination_sessions │
          │ status: "Scheduled"  │
          │ administered: 0      │
          └────────────┬─────────┘
                       │
                       ▼
          ┌──────────────────────┐
          │ Health Worker Updates│
          │ Administered Count   │
          └────────────┬─────────┘
                       │
                       ▼
          ┌──────────────────────┐
          │ Auto-deduct from     │
          │ barangay_vaccine_    │
          │ inventory            │
          └────────────┬─────────┘
                       │
                       ▼
          ┌──────────────────────┐
          │ Mark as "Completed"  │
          │ when target reached  │
          └──────────────────────┘
```

### Inventory Management Workflow

```
┌──────────────────────────────────────────┐
│ Head Nurse Approves Vaccine Request      │
└────────────────────┬─────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Create inventory record│
        │ barangay_vaccine_      │
        │ inventory              │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Set quantity_vial      │
        │ quantity_dose          │
        │ batch_number           │
        │ expiry_date            │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Health Worker Creates  │
        │ Vaccination Session    │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Updates Administered   │
        │ Count                  │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Auto-deduct from       │
        │ quantity_vial          │
        │ (FIFO method)          │
        └────────────┬───────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Low Stock Alert        │
        │ (if < 5 vials)         │
        └────────────────────────┘
```

---

## 🔍 Column Type Reference

```
┌──────────────────┬─────────────────────────────────────┐
│ Data Type        │ Example / Description               │
├──────────────────┼─────────────────────────────────────┤
│ UUID             │ 550e8400-e29b-41d4-a716-446655440000│
│ VARCHAR(255)     │ "John", "Pfizer", "Daet"            │
│ TEXT             │ Long text, notes, descriptions      │
│ INTEGER          │ 100, 50, 0                          │
│ DATE             │ 2025-11-20                          │
│ TIME             │ 14:30:00                            │
│ TIMESTAMP        │ 2025-11-20 14:30:00+00              │
│ BOOLEAN          │ true / false                        │
└──────────────────┴─────────────────────────────────────┘
```

---

## 📋 Status Values

```
vaccine_requests.status
├─ "pending"    ← Initial state, awaiting approval
├─ "approved"   ← Head Nurse approved, auto-added to inventory
├─ "rejected"   ← Head Nurse rejected
└─ "released"   ← Ready for use

vaccination_sessions.status
├─ "Scheduled"  ← Created, not started
├─ "In progress"← Currently happening
└─ "Completed"  ← Finished

user_role
├─ "Health Worker" ← Can create requests, manage own sessions
└─ "Head Nurse"    ← Admin, can approve/reject requests

vaccines.status
├─ "Active"     ← Available for use
└─ "Inactive"   ← Not available
```

---

## 🎯 Key Indexes for Performance

```
user_profiles
├─ idx_user_profiles_email
├─ idx_user_profiles_user_role
└─ idx_user_profiles_assigned_barangay_id

vaccine_requests
├─ idx_vaccine_requests_barangay_id
├─ idx_vaccine_requests_vaccine_id
├─ idx_vaccine_requests_requested_by ⚠️ CRITICAL
├─ idx_vaccine_requests_status
└─ idx_vaccine_requests_created_at

vaccination_sessions
├─ idx_vaccination_sessions_barangay_id
├─ idx_vaccination_sessions_vaccine_id
├─ idx_vaccination_sessions_created_by
├─ idx_vaccination_sessions_session_date
└─ idx_vaccination_sessions_status

barangay_vaccine_inventory
├─ idx_barangay_vaccine_inventory_barangay_id
├─ idx_barangay_vaccine_inventory_vaccine_id
└─ idx_barangay_vaccine_inventory_expiry_date
```

---

## ⚠️ Critical Fields to Check

```
MUST EXIST:
├─ vaccine_requests.requested_by ⚠️⚠️⚠️
├─ user_profiles.assigned_barangay_id ⚠️⚠️⚠️
├─ vaccine_requests.status
├─ vaccination_sessions.status
└─ user_profiles.user_role

MUST BE FOREIGN KEYS:
├─ vaccine_requests.barangay_id → barangays.id
├─ vaccine_requests.vaccine_id → vaccines.id
├─ vaccine_requests.requested_by → user_profiles.id ⚠️
├─ user_profiles.assigned_barangay_id → barangays.id ⚠️
├─ barangay_vaccine_inventory.barangay_id → barangays.id
├─ barangay_vaccine_inventory.vaccine_id → vaccines.id
├─ vaccination_sessions.barangay_id → barangays.id
├─ vaccination_sessions.vaccine_id → vaccines.id
└─ vaccination_sessions.created_by → user_profiles.id
```

---

## 📊 Typical Data Sizes

```
Small Deployment (1 barangay, 1 health worker):
├─ user_profiles: 2 rows
├─ barangays: 1 row
├─ vaccines: 5-10 rows
├─ vaccine_requests: 10-50 rows
├─ barangay_vaccine_inventory: 5-20 rows
└─ vaccination_sessions: 20-100 rows

Medium Deployment (10 barangays, 10 health workers):
├─ user_profiles: 12 rows
├─ barangays: 10 rows
├─ vaccines: 10-20 rows
├─ vaccine_requests: 100-500 rows
├─ barangay_vaccine_inventory: 50-200 rows
└─ vaccination_sessions: 200-1000 rows

Large Deployment (50 barangays, 50 health workers):
├─ user_profiles: 52 rows
├─ barangays: 50 rows
├─ vaccines: 20-50 rows
├─ vaccine_requests: 500-2000 rows
├─ barangay_vaccine_inventory: 200-1000 rows
└─ vaccination_sessions: 1000-5000 rows
```

---

**Visual Reference Complete**  
**Last Updated:** November 20, 2025
