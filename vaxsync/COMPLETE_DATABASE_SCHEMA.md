# VaxSync - Complete Database Schema Documentation

**Last Updated:** November 20, 2025  
**Status:** Complete Reference for All Tables and Relationships

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Data Relationships](#data-relationships)
4. [RLS Policies](#rls-policies)
5. [Indexes](#indexes)
6. [SQL Creation Scripts](#sql-creation-scripts)
7. [Data Flow](#data-flow)
8. [Troubleshooting](#troubleshooting)

---

## Overview

VaxSync is a vaccination management system built with Supabase (PostgreSQL). The database consists of 7 main tables:

- **user_profiles** - User accounts and roles
- **barangays** - Barangay (village) information
- **vaccines** - Vaccine inventory master data
- **vaccine_requests** - Requests for vaccines from health workers
- **barangay_vaccine_inventory** - Vaccine stock per barangay
- **vaccination_sessions** - Scheduled vaccination sessions
- **auth.users** - Supabase authentication (managed by Supabase)

---

## Core Tables

### 1. user_profiles

**Purpose:** Store user account information and role-based access control

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key, links to auth.users |
| first_name | VARCHAR(255) | NO | - | User's first name |
| last_name | VARCHAR(255) | NO | - | User's last name |
| email | VARCHAR(255) | NO | - | User's email address |
| date_of_birth | DATE | YES | NULL | User's date of birth |
| sex | VARCHAR(10) | YES | NULL | User's sex (M/F) |
| address | TEXT | YES | NULL | User's address |
| user_role | VARCHAR(50) | NO | 'Health Worker' | Role: 'Health Worker' or 'Head Nurse' |
| auth_code | VARCHAR(255) | YES | NULL | Authentication code for signup |
| assigned_barangay_id | UUID | YES | NULL | FK to barangays.id (for Health Workers) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Foreign Keys:**
- `assigned_barangay_id` → `barangays.id`

**Indexes:**
- `idx_user_profiles_email` - For login queries
- `idx_user_profiles_user_role` - For role-based filtering
- `idx_user_profiles_assigned_barangay_id` - For barangay queries

**RLS Policies:**
- ✅ Authenticated users can READ their own profile
- ✅ Authenticated users can UPDATE their own profile
- ✅ Head Nurse can READ all profiles

---

### 2. barangays

**Purpose:** Store barangay (village) information and health worker assignments

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| name | VARCHAR(255) | NO | - | Barangay name (UNIQUE) |
| municipality | VARCHAR(255) | NO | 'Daet' | Municipality name |
| population | INTEGER | YES | 0 | Barangay population |
| assigned_health_worker | UUID | YES | NULL | FK to user_profiles.id |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys:**
- `assigned_health_worker` → `user_profiles.id`

**Indexes:**
- `idx_barangays_name` - For search queries
- `idx_barangays_assigned_health_worker` - For health worker queries

**RLS Policies:**
- ✅ Authenticated users can READ all barangays
- ✅ Head Nurse can INSERT barangays
- ✅ Head Nurse can UPDATE barangays
- ✅ Head Nurse can DELETE barangays

---

### 3. vaccines

**Purpose:** Master data for available vaccines

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| name | VARCHAR(255) | NO | - | Vaccine name (e.g., "COVID-19", "Pfizer") |
| batch_number | VARCHAR(255) | YES | NULL | Batch number |
| quantity_available | INTEGER | YES | 0 | Total quantity available |
| expiry_date | DATE | YES | NULL | Vaccine expiry date |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| location | VARCHAR(255) | YES | NULL | Storage location |
| notes | TEXT | YES | NULL | Additional notes |
| status | VARCHAR(50) | YES | 'Active' | Status: 'Active' or 'Inactive' |

**Indexes:**
- `idx_vaccines_name` - For search queries
- `idx_vaccines_status` - For active vaccine filtering

**RLS Policies:**
- ✅ Authenticated users can READ all vaccines
- ✅ Head Nurse can INSERT vaccines
- ✅ Head Nurse can UPDATE vaccines
- ✅ Head Nurse can DELETE vaccines

---

### 4. vaccine_requests

**Purpose:** Track vaccine requests from health workers to head nurse

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| barangay_id | UUID | NO | - | FK to barangays.id |
| vaccine_id | UUID | NO | - | FK to vaccines.id |
| requested_by | UUID | NO | - | FK to user_profiles.id (health worker) |
| quantity_dose | INTEGER | NO | - | Number of doses requested |
| quantity_vial | INTEGER | YES | NULL | Number of vials requested |
| status | VARCHAR(50) | NO | 'pending' | Status: 'pending', 'approved', 'rejected', 'released' |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Request creation timestamp |
| requested_at | TIMESTAMP | YES | NULL | Request submission timestamp |
| notes | TEXT | YES | NULL | Additional notes |
| request_code | VARCHAR(255) | YES | NULL | Unique request code |

**Foreign Keys:**
- `barangay_id` → `barangays.id`
- `vaccine_id` → `vaccines.id`
- `requested_by` → `user_profiles.id`

**Indexes:**
- `idx_vaccine_requests_barangay_id` - For barangay filtering
- `idx_vaccine_requests_vaccine_id` - For vaccine filtering
- `idx_vaccine_requests_requested_by` - For user filtering
- `idx_vaccine_requests_status` - For status filtering
- `idx_vaccine_requests_created_at` - For date sorting

**RLS Policies:**
- ✅ Health Worker can READ own requests (`requested_by = auth.uid()`)
- ✅ Health Worker can INSERT own requests
- ✅ Health Worker can UPDATE own requests
- ✅ Health Worker can DELETE own requests
- ✅ Head Nurse can READ all requests
- ✅ Head Nurse can UPDATE all requests (status changes)
- ✅ Head Nurse can DELETE all requests

---

### 5. barangay_vaccine_inventory

**Purpose:** Track vaccine inventory per barangay

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| barangay_id | UUID | NO | - | FK to barangays.id |
| vaccine_id | UUID | NO | - | FK to vaccines.id |
| quantity_vial | INTEGER | NO | 0 | Number of vials in stock |
| quantity_dose | INTEGER | NO | 0 | Number of doses in stock |
| batch_number | VARCHAR(255) | YES | NULL | Vaccine batch number |
| expiry_date | DATE | YES | NULL | Vaccine expiry date |
| reserved_vial | INTEGER | YES | 0 | Number of vials reserved for sessions |
| notes | TEXT | YES | NULL | Additional notes |
| received_date | TIMESTAMP | YES | NULL | Date inventory was received |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Foreign Keys:**
- `barangay_id` → `barangays.id`
- `vaccine_id` → `vaccines.id`

**Indexes:**
- `idx_barangay_vaccine_inventory_barangay_id` - For barangay filtering
- `idx_barangay_vaccine_inventory_vaccine_id` - For vaccine filtering
- `idx_barangay_vaccine_inventory_expiry_date` - For expiry tracking

**RLS Policies:**
- ✅ Health Worker can READ inventory for assigned barangay
- ✅ Health Worker can UPDATE inventory for assigned barangay
- ✅ Head Nurse can READ all inventory
- ✅ Head Nurse can INSERT inventory
- ✅ Head Nurse can UPDATE all inventory
- ✅ Head Nurse can DELETE inventory

---

### 6. vaccination_sessions

**Purpose:** Track scheduled vaccination sessions

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| barangay_id | UUID | NO | - | FK to barangays.id |
| vaccine_id | UUID | NO | - | FK to vaccines.id |
| session_date | DATE | NO | - | Date of vaccination session |
| session_time | TIME | NO | - | Time of vaccination session |
| target | INTEGER | NO | 0 | Target number of people to vaccinate |
| administered | INTEGER | NO | 0 | Number of people actually vaccinated |
| status | VARCHAR(50) | NO | 'Scheduled' | Status: 'Scheduled', 'In progress', 'Completed' |
| created_by | UUID | NO | - | FK to user_profiles.id (health worker) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Foreign Keys:**
- `barangay_id` → `barangays.id`
- `vaccine_id` → `vaccines.id`
- `created_by` → `user_profiles.id`

**Indexes:**
- `idx_vaccination_sessions_barangay_id` - For barangay filtering
- `idx_vaccination_sessions_vaccine_id` - For vaccine filtering
- `idx_vaccination_sessions_created_by` - For user filtering
- `idx_vaccination_sessions_session_date` - For date filtering
- `idx_vaccination_sessions_status` - For status filtering

**RLS Policies:**
- ✅ Authenticated users can READ all sessions
- ✅ Authenticated users can INSERT sessions
- ✅ Authenticated users can UPDATE sessions
- ✅ Authenticated users can DELETE sessions

---

## Data Relationships

### Relationship Diagram

```
auth.users (Supabase managed)
    ↓
user_profiles (id)
    ├─→ assigned_barangay_id → barangays (id)
    ├─→ vaccine_requests (requested_by)
    └─→ vaccination_sessions (created_by)

barangays (id)
    ├─→ vaccine_requests (barangay_id)
    ├─→ vaccination_sessions (barangay_id)
    └─→ barangay_vaccine_inventory (barangay_id)

vaccines (id)
    ├─→ vaccine_requests (vaccine_id)
    ├─→ vaccination_sessions (vaccine_id)
    └─→ barangay_vaccine_inventory (vaccine_id)
```

### Key Relationships

**1. User → Barangay (One-to-One for Health Workers)**
- Health Worker assigned to ONE barangay
- Barangay can have ONE assigned Health Worker
- Used for: Filtering requests and sessions by user's barangay

**2. Vaccine Request → Vaccine (Many-to-One)**
- Multiple requests can be for same vaccine
- Used for: Tracking demand for specific vaccines

**3. Vaccine Request → Barangay (Many-to-One)**
- Multiple requests can be from same barangay
- Used for: Inventory management

**4. Vaccination Session → Vaccine (Many-to-One)**
- Multiple sessions can use same vaccine
- Used for: Inventory deduction

**5. Barangay Inventory → Vaccine (Many-to-One)**
- Multiple inventory records per vaccine per barangay
- Used for: FIFO inventory tracking

---

## RLS Policies

### Health Worker Permissions

**User Profiles:**
- ✅ READ own profile
- ✅ UPDATE own profile

**Barangays:**
- ✅ READ all barangays

**Vaccines:**
- ✅ READ all vaccines

**Vaccine Requests:**
- ✅ READ own requests
- ✅ CREATE own requests
- ✅ UPDATE own requests
- ✅ DELETE own requests

**Barangay Vaccine Inventory:**
- ✅ READ inventory for assigned barangay
- ✅ UPDATE inventory for assigned barangay

**Vaccination Sessions:**
- ✅ READ all sessions
- ✅ CREATE sessions
- ✅ UPDATE sessions
- ✅ DELETE sessions

### Head Nurse Permissions

**User Profiles:**
- ✅ READ all profiles
- ✅ UPDATE all profiles

**Barangays:**
- ✅ READ all barangays
- ✅ CREATE barangays
- ✅ UPDATE barangays
- ✅ DELETE barangays

**Vaccines:**
- ✅ READ all vaccines
- ✅ CREATE vaccines
- ✅ UPDATE vaccines
- ✅ DELETE vaccines

**Vaccine Requests:**
- ✅ READ all requests
- ✅ UPDATE all requests (approve/reject/release)
- ✅ DELETE all requests

**Barangay Vaccine Inventory:**
- ✅ READ all inventory
- ✅ CREATE inventory
- ✅ UPDATE all inventory
- ✅ DELETE inventory

**Vaccination Sessions:**
- ✅ READ all sessions
- ✅ CREATE sessions
- ✅ UPDATE sessions
- ✅ DELETE sessions

---

## Indexes

### Performance Indexes

**user_profiles:**
```sql
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_user_role ON user_profiles(user_role);
CREATE INDEX idx_user_profiles_assigned_barangay_id ON user_profiles(assigned_barangay_id);
```

**barangays:**
```sql
CREATE INDEX idx_barangays_name ON barangays(name);
CREATE INDEX idx_barangays_assigned_health_worker ON barangays(assigned_health_worker);
```

**vaccines:**
```sql
CREATE INDEX idx_vaccines_name ON vaccines(name);
CREATE INDEX idx_vaccines_status ON vaccines(status);
```

**vaccine_requests:**
```sql
CREATE INDEX idx_vaccine_requests_barangay_id ON vaccine_requests(barangay_id);
CREATE INDEX idx_vaccine_requests_vaccine_id ON vaccine_requests(vaccine_id);
CREATE INDEX idx_vaccine_requests_requested_by ON vaccine_requests(requested_by);
CREATE INDEX idx_vaccine_requests_status ON vaccine_requests(status);
CREATE INDEX idx_vaccine_requests_created_at ON vaccine_requests(created_at);
```

**barangay_vaccine_inventory:**
```sql
CREATE INDEX idx_barangay_vaccine_inventory_barangay_id ON barangay_vaccine_inventory(barangay_id);
CREATE INDEX idx_barangay_vaccine_inventory_vaccine_id ON barangay_vaccine_inventory(vaccine_id);
CREATE INDEX idx_barangay_vaccine_inventory_expiry_date ON barangay_vaccine_inventory(expiry_date);
```

**vaccination_sessions:**
```sql
CREATE INDEX idx_vaccination_sessions_barangay_id ON vaccination_sessions(barangay_id);
CREATE INDEX idx_vaccination_sessions_vaccine_id ON vaccination_sessions(vaccine_id);
CREATE INDEX idx_vaccination_sessions_created_by ON vaccination_sessions(created_by);
CREATE INDEX idx_vaccination_sessions_session_date ON vaccination_sessions(session_date);
CREATE INDEX idx_vaccination_sessions_status ON vaccination_sessions(status);
```

---

## SQL Creation Scripts

### Complete Schema Creation

```sql
-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  date_of_birth DATE,
  sex VARCHAR(10),
  address TEXT,
  user_role VARCHAR(50) NOT NULL DEFAULT 'Health Worker',
  auth_code VARCHAR(255),
  assigned_barangay_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- BARANGAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.barangays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  municipality VARCHAR(255) NOT NULL DEFAULT 'Daet',
  population INTEGER DEFAULT 0,
  assigned_health_worker UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to user_profiles
ALTER TABLE public.user_profiles
ADD CONSTRAINT fk_user_profiles_assigned_barangay_id 
FOREIGN KEY (assigned_barangay_id) REFERENCES public.barangays(id);

-- ============================================
-- VACCINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vaccines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  batch_number VARCHAR(255),
  quantity_available INTEGER DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  location VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Active'
);

-- ============================================
-- VACCINE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vaccine_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  quantity_dose INTEGER NOT NULL,
  quantity_vial INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  requested_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  request_code VARCHAR(255)
);

-- ============================================
-- BARANGAY VACCINE INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.barangay_vaccine_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  quantity_vial INTEGER NOT NULL DEFAULT 0,
  quantity_dose INTEGER NOT NULL DEFAULT 0,
  batch_number VARCHAR(255),
  expiry_date DATE,
  reserved_vial INTEGER DEFAULT 0,
  notes TEXT,
  received_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- VACCINATION SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vaccination_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barangay_id UUID NOT NULL REFERENCES public.barangays(id) ON DELETE CASCADE,
  vaccine_id UUID NOT NULL REFERENCES public.vaccines(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  target INTEGER NOT NULL DEFAULT 0,
  administered INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
  created_by UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- CREATE ALL INDEXES
-- ============================================
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_user_role ON public.user_profiles(user_role);
CREATE INDEX idx_user_profiles_assigned_barangay_id ON public.user_profiles(assigned_barangay_id);

CREATE INDEX idx_barangays_name ON public.barangays(name);
CREATE INDEX idx_barangays_assigned_health_worker ON public.barangays(assigned_health_worker);

CREATE INDEX idx_vaccines_name ON public.vaccines(name);
CREATE INDEX idx_vaccines_status ON public.vaccines(status);

CREATE INDEX idx_vaccine_requests_barangay_id ON public.vaccine_requests(barangay_id);
CREATE INDEX idx_vaccine_requests_vaccine_id ON public.vaccine_requests(vaccine_id);
CREATE INDEX idx_vaccine_requests_requested_by ON public.vaccine_requests(requested_by);
CREATE INDEX idx_vaccine_requests_status ON public.vaccine_requests(status);
CREATE INDEX idx_vaccine_requests_created_at ON public.vaccine_requests(created_at);

CREATE INDEX idx_barangay_vaccine_inventory_barangay_id ON public.barangay_vaccine_inventory(barangay_id);
CREATE INDEX idx_barangay_vaccine_inventory_vaccine_id ON public.barangay_vaccine_inventory(vaccine_id);
CREATE INDEX idx_barangay_vaccine_inventory_expiry_date ON public.barangay_vaccine_inventory(expiry_date);

CREATE INDEX idx_vaccination_sessions_barangay_id ON public.vaccination_sessions(barangay_id);
CREATE INDEX idx_vaccination_sessions_vaccine_id ON public.vaccination_sessions(vaccine_id);
CREATE INDEX idx_vaccination_sessions_created_by ON public.vaccination_sessions(created_by);
CREATE INDEX idx_vaccination_sessions_session_date ON public.vaccination_sessions(session_date);
CREATE INDEX idx_vaccination_sessions_status ON public.vaccination_sessions(status);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barangay_vaccine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_sessions ENABLE ROW LEVEL SECURITY;
```

---

## Data Flow

### User Registration Flow

```
User Signs Up
    ↓
auth.users created (Supabase Auth)
    ↓
user_profiles record created
    ↓
assigned_barangay_id set (for Health Workers)
    ↓
User can log in
```

### Vaccine Request Flow

```
Health Worker creates vaccine request
    ↓
vaccine_requests record created (status: pending)
    ↓
Head Nurse reviews request
    ↓
Head Nurse approves/rejects
    ↓
If approved:
  ├─ vaccine_requests.status = 'approved'
  ├─ barangay_vaccine_inventory record created
  └─ vaccine_requests.status = 'released'
```

### Vaccination Session Flow

```
Health Worker creates vaccination session
    ↓
vaccination_sessions record created (status: Scheduled)
    ↓
Health Worker updates administered count
    ↓
If administered > 0:
  ├─ barangay_vaccine_inventory.quantity_vial decreased
  └─ vaccination_sessions.administered updated
    ↓
Session marked as completed
```

### Inventory Management Flow

```
Head Nurse adds vaccine to barangay
    ↓
barangay_vaccine_inventory record created
    ↓
Health Worker uses vaccine in session
    ↓
Inventory automatically deducted
    ↓
Low stock alerts triggered
```

---

## Troubleshooting

### Issue: "Column not found" errors

**Symptoms:**
- `requested_by` column not found in vaccine_requests
- `assigned_barangay_id` relationship not found in user_profiles

**Solution:**
1. Check if column exists:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vaccine_requests' AND column_name = 'requested_by';
```

2. If missing, add column:
```sql
ALTER TABLE public.vaccine_requests
ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.user_profiles(id);
```

### Issue: RLS policies blocking queries

**Symptoms:**
- Queries return empty results
- "Permission denied" errors in console

**Solution:**
1. Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'vaccine_requests';
```

2. Check existing policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'vaccine_requests';
```

3. If policies are too restrictive, update them (see RLS Policies section above)

### Issue: Foreign key constraint violations

**Symptoms:**
- "Foreign key constraint violation" when inserting data
- Cannot delete records

**Solution:**
1. Check if foreign key exists:
```sql
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'vaccine_requests' AND constraint_type = 'FOREIGN KEY';
```

2. If missing, add foreign key:
```sql
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id);
```

### Issue: Data not fetching

**Symptoms:**
- Pages show "Loading..." indefinitely
- Console shows no errors

**Solution:**
1. Check if table exists:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'vaccine_requests';
```

2. Check if data exists:
```sql
SELECT COUNT(*) FROM public.vaccine_requests;
```

3. Check RLS policies allow SELECT:
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'vaccine_requests' AND policyname LIKE '%SELECT%';
```

---

## Quick Reference

### Common Queries

**Get user profile with barangay:**
```sql
SELECT up.*, b.name as barangay_name 
FROM user_profiles up
LEFT JOIN barangays b ON up.assigned_barangay_id = b.id
WHERE up.id = 'user-id';
```

**Get all vaccine requests for a barangay:**
```sql
SELECT vr.*, v.name as vaccine_name, up.first_name, up.last_name
FROM vaccine_requests vr
JOIN vaccines v ON vr.vaccine_id = v.id
JOIN user_profiles up ON vr.requested_by = up.id
WHERE vr.barangay_id = 'barangay-id'
ORDER BY vr.created_at DESC;
```

**Get barangay vaccine inventory:**
```sql
SELECT bvi.*, v.name as vaccine_name
FROM barangay_vaccine_inventory bvi
JOIN vaccines v ON bvi.vaccine_id = v.id
WHERE bvi.barangay_id = 'barangay-id'
ORDER BY bvi.created_at DESC;
```

**Get vaccination sessions for a date:**
```sql
SELECT vs.*, v.name as vaccine_name, b.name as barangay_name
FROM vaccination_sessions vs
JOIN vaccines v ON vs.vaccine_id = v.id
JOIN barangays b ON vs.barangay_id = b.id
WHERE vs.session_date = '2025-11-20'
ORDER BY vs.session_time;
```

---

## Maintenance

### Regular Checks

- [ ] Monitor table sizes (especially vaccine_requests and vaccination_sessions)
- [ ] Review RLS policies monthly
- [ ] Check for expired vaccines in inventory
- [ ] Verify foreign key relationships
- [ ] Monitor index performance

### Backup Strategy

- Daily automated backups via Supabase
- Export critical data weekly
- Test restore procedures monthly

---

**End of Schema Documentation**
