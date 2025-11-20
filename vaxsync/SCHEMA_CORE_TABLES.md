# VaxSync - Core Tables Schema

**Focus:** barangays, vaccine_requests, vaccination_sessions  
**Last Updated:** November 20, 2025

---

## 📊 Three Core Tables

### 1. barangays

**Purpose:** Store barangay (village) information

**Table Structure:**
```sql
CREATE TABLE IF NOT EXISTS public.barangays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  municipality VARCHAR(255) NOT NULL DEFAULT 'Daet',
  population INTEGER DEFAULT 0,
  assigned_health_worker UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| name | VARCHAR(255) | NO | - | Barangay name (UNIQUE) |
| municipality | VARCHAR(255) | NO | 'Daet' | Municipality name |
| population | INTEGER | YES | 0 | Barangay population |
| assigned_health_worker | UUID | YES | NULL | FK to user_profiles.id |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |

**Indexes:**
```sql
CREATE INDEX idx_barangays_name ON public.barangays(name);
CREATE INDEX idx_barangays_assigned_health_worker ON public.barangays(assigned_health_worker);
```

**Constraints:**
```sql
-- Name must be unique
ALTER TABLE public.barangays
ADD CONSTRAINT unique_barangay_name UNIQUE (name);

-- Name and municipality cannot be NULL
ALTER TABLE public.barangays
ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.barangays
ALTER COLUMN municipality SET NOT NULL;

-- Population must be >= 0
ALTER TABLE public.barangays
ADD CONSTRAINT check_population CHECK (population >= 0);
```

**RLS Policies:**
- ✅ All authenticated users can READ
- ✅ Head Nurse can INSERT
- ✅ Head Nurse can UPDATE
- ✅ Head Nurse can DELETE

---

### 2. vaccine_requests ⚠️ CRITICAL

**Purpose:** Track vaccine requests from health workers

**Table Structure:**
```sql
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
```

**Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| barangay_id | UUID | NO | - | FK to barangays.id |
| vaccine_id | UUID | NO | - | FK to vaccines.id |
| requested_by | UUID | NO | - | FK to user_profiles.id (health worker) ⚠️ |
| quantity_dose | INTEGER | NO | - | Number of doses requested |
| quantity_vial | INTEGER | YES | NULL | Number of vials requested |
| status | VARCHAR(50) | NO | 'pending' | Status: pending, approved, rejected, released |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Request creation timestamp |
| requested_at | TIMESTAMP | YES | NULL | Request submission timestamp |
| notes | TEXT | YES | NULL | Additional notes |
| request_code | VARCHAR(255) | YES | NULL | Unique request code |

**Indexes:**
```sql
CREATE INDEX idx_vaccine_requests_barangay_id ON public.vaccine_requests(barangay_id);
CREATE INDEX idx_vaccine_requests_vaccine_id ON public.vaccine_requests(vaccine_id);
CREATE INDEX idx_vaccine_requests_requested_by ON public.vaccine_requests(requested_by);
CREATE INDEX idx_vaccine_requests_status ON public.vaccine_requests(status);
CREATE INDEX idx_vaccine_requests_created_at ON public.vaccine_requests(created_at);
```

**Constraints:**
```sql
-- All critical fields cannot be NULL
ALTER TABLE public.vaccine_requests
ALTER COLUMN barangay_id SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN vaccine_id SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN requested_by SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN quantity_dose SET NOT NULL;

ALTER TABLE public.vaccine_requests
ALTER COLUMN status SET NOT NULL;

-- Status must be valid
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_status 
CHECK (status IN ('pending', 'approved', 'rejected', 'released'));

-- Quantity must be positive
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_quantity CHECK (quantity_dose > 0);

-- Quantity vial must be non-negative
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT check_request_vial CHECK (quantity_vial IS NULL OR quantity_vial >= 0);
```

**Foreign Keys:**
```sql
ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE;

ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_vaccine_id 
FOREIGN KEY (vaccine_id) REFERENCES public.vaccines(id) ON DELETE CASCADE;

ALTER TABLE public.vaccine_requests
ADD CONSTRAINT fk_vaccine_requests_requested_by 
FOREIGN KEY (requested_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
```

**RLS Policies:**
- ✅ Health Worker can READ own requests
- ✅ Health Worker can CREATE own requests
- ✅ Health Worker can UPDATE own requests
- ✅ Health Worker can DELETE own requests
- ✅ Head Nurse can READ all requests
- ✅ Head Nurse can UPDATE all requests
- ✅ Head Nurse can DELETE all requests

**Status Values:**
- `pending` - Initial state, awaiting approval
- `approved` - Head Nurse approved
- `rejected` - Head Nurse rejected
- `released` - Ready for use

---

### 3. vaccination_sessions

**Purpose:** Track scheduled vaccination sessions

**Table Structure:**
```sql
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
```

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
| status | VARCHAR(50) | NO | 'Scheduled' | Status: Scheduled, In progress, Completed |
| created_by | UUID | NO | - | FK to user_profiles.id (health worker) |
| created_at | TIMESTAMP | NO | CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | YES | NULL | Last update timestamp |

**Indexes:**
```sql
CREATE INDEX idx_vaccination_sessions_barangay_id ON public.vaccination_sessions(barangay_id);
CREATE INDEX idx_vaccination_sessions_vaccine_id ON public.vaccination_sessions(vaccine_id);
CREATE INDEX idx_vaccination_sessions_created_by ON public.vaccination_sessions(created_by);
CREATE INDEX idx_vaccination_sessions_session_date ON public.vaccination_sessions(session_date);
CREATE INDEX idx_vaccination_sessions_status ON public.vaccination_sessions(status);
```

**Constraints:**
```sql
-- All critical fields cannot be NULL
ALTER TABLE public.vaccination_sessions
ALTER COLUMN barangay_id SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN vaccine_id SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN session_date SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN session_time SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN target SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN administered SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.vaccination_sessions
ALTER COLUMN created_by SET NOT NULL;

-- Status must be valid
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_session_status 
CHECK (status IN ('Scheduled', 'In progress', 'Completed'));

-- Target must be positive
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_session_target CHECK (target > 0);

-- Administered must be non-negative
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_session_administered CHECK (administered >= 0);

-- Administered cannot exceed target
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT check_administered_vs_target CHECK (administered <= target);
```

**Foreign Keys:**
```sql
ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT fk_vaccination_sessions_barangay_id 
FOREIGN KEY (barangay_id) REFERENCES public.barangays(id) ON DELETE CASCADE;

ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT fk_vaccination_sessions_vaccine_id 
FOREIGN KEY (vaccine_id) REFERENCES public.vaccines(id) ON DELETE CASCADE;

ALTER TABLE public.vaccination_sessions
ADD CONSTRAINT fk_vaccination_sessions_created_by 
FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE CASCADE;
```

**RLS Policies:**
- ✅ All authenticated users can READ
- ✅ All authenticated users can CREATE
- ✅ All authenticated users can UPDATE
- ✅ All authenticated users can DELETE

**Status Values:**
- `Scheduled` - Created, not started
- `In progress` - Currently happening
- `Completed` - Finished

---

## 🔗 Relationships

```
barangays (id)
    ├─ vaccine_requests (barangay_id)
    └─ vaccination_sessions (barangay_id)

vaccines (id)
    ├─ vaccine_requests (vaccine_id)
    └─ vaccination_sessions (vaccine_id)

user_profiles (id)
    ├─ vaccine_requests (requested_by)
    └─ vaccination_sessions (created_by)
```

---

## 📋 Data Flow

### Vaccine Request Workflow
```
Health Worker creates vaccine request
    ↓
vaccine_requests (status: pending)
    ↓
Head Nurse approves/rejects
    ↓
If approved:
  ├─ status = 'approved'
  ├─ Auto-add to inventory
  └─ status = 'released'
```

### Vaccination Session Workflow
```
Health Worker creates session
    ↓
vaccination_sessions (status: Scheduled)
    ↓
Health Worker updates administered count
    ↓
Auto-deduct from inventory
    ↓
Mark as Completed
```

---

## ✅ Verification Queries

### Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('barangays', 'vaccine_requests', 'vaccination_sessions');
```

### Check Columns Exist
```sql
-- barangays columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'barangays' ORDER BY ordinal_position;

-- vaccine_requests columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'vaccine_requests' ORDER BY ordinal_position;

-- vaccination_sessions columns
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'vaccination_sessions' ORDER BY ordinal_position;
```

### Check Foreign Keys
```sql
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name IN ('barangays', 'vaccine_requests', 'vaccination_sessions')
AND constraint_type = 'FOREIGN KEY';
```

### Check Indexes
```sql
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('barangays', 'vaccine_requests', 'vaccination_sessions')
ORDER BY tablename;
```

### Check Constraints
```sql
SELECT constraint_name, table_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name IN ('barangays', 'vaccine_requests', 'vaccination_sessions')
ORDER BY table_name, constraint_name;
```

### Check Data
```sql
-- Count records
SELECT 'barangays' as table_name, COUNT(*) as count FROM barangays
UNION ALL
SELECT 'vaccine_requests', COUNT(*) FROM vaccine_requests
UNION ALL
SELECT 'vaccination_sessions', COUNT(*) FROM vaccination_sessions;

-- View sample data
SELECT * FROM barangays LIMIT 5;
SELECT * FROM vaccine_requests LIMIT 5;
SELECT * FROM vaccination_sessions LIMIT 5;
```

---

## 🚀 SQL Creation Scripts

### Complete Schema Creation

```sql
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
-- CREATE INDEXES
-- ============================================
CREATE INDEX idx_barangays_name ON public.barangays(name);
CREATE INDEX idx_barangays_assigned_health_worker ON public.barangays(assigned_health_worker);

CREATE INDEX idx_vaccine_requests_barangay_id ON public.vaccine_requests(barangay_id);
CREATE INDEX idx_vaccine_requests_vaccine_id ON public.vaccine_requests(vaccine_id);
CREATE INDEX idx_vaccine_requests_requested_by ON public.vaccine_requests(requested_by);
CREATE INDEX idx_vaccine_requests_status ON public.vaccine_requests(status);
CREATE INDEX idx_vaccine_requests_created_at ON public.vaccine_requests(created_at);

CREATE INDEX idx_vaccination_sessions_barangay_id ON public.vaccination_sessions(barangay_id);
CREATE INDEX idx_vaccination_sessions_vaccine_id ON public.vaccination_sessions(vaccine_id);
CREATE INDEX idx_vaccination_sessions_created_by ON public.vaccination_sessions(created_by);
CREATE INDEX idx_vaccination_sessions_session_date ON public.vaccination_sessions(session_date);
CREATE INDEX idx_vaccination_sessions_status ON public.vaccination_sessions(status);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccine_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_sessions ENABLE ROW LEVEL SECURITY;
```

---

## 🔐 RLS Policies

### barangays Policies
```sql
-- All authenticated users can read
CREATE POLICY "Authenticated users can read barangays"
ON public.barangays FOR SELECT
USING (auth.role() = 'authenticated');

-- Head Nurse can insert
CREATE POLICY "Head Nurse can insert barangays"
ON public.barangays FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse')
);

-- Head Nurse can update
CREATE POLICY "Head Nurse can update barangays"
ON public.barangays FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse')
);

-- Head Nurse can delete
CREATE POLICY "Head Nurse can delete barangays"
ON public.barangays FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse')
);
```

### vaccine_requests Policies
```sql
-- Health Worker: read own requests
CREATE POLICY "Health Worker SELECT"
ON public.vaccine_requests FOR SELECT
USING (requested_by = auth.uid());

-- Health Worker: create requests
CREATE POLICY "Health Worker INSERT"
ON public.vaccine_requests FOR INSERT
WITH CHECK (requested_by = auth.uid());

-- Health Worker: update own requests
CREATE POLICY "Health Worker UPDATE"
ON public.vaccine_requests FOR UPDATE
USING (requested_by = auth.uid());

-- Health Worker: delete own requests
CREATE POLICY "Health Worker DELETE"
ON public.vaccine_requests FOR DELETE
USING (requested_by = auth.uid());

-- Head Nurse: read all requests
CREATE POLICY "Head Nurse SELECT"
ON public.vaccine_requests FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse')
);

-- Head Nurse: update all requests
CREATE POLICY "Head Nurse UPDATE"
ON public.vaccine_requests FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse')
);

-- Head Nurse: delete all requests
CREATE POLICY "Head Nurse DELETE"
ON public.vaccine_requests FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_role = 'Head Nurse')
);
```

### vaccination_sessions Policies
```sql
-- All authenticated users can read
CREATE POLICY "SELECT vaccination_sessions"
ON public.vaccination_sessions FOR SELECT
USING (auth.role() = 'authenticated');

-- All authenticated users can insert
CREATE POLICY "INSERT vaccination_sessions"
ON public.vaccination_sessions FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update
CREATE POLICY "UPDATE vaccination_sessions"
ON public.vaccination_sessions FOR UPDATE
USING (auth.role() = 'authenticated');

-- All authenticated users can delete
CREATE POLICY "DELETE vaccination_sessions"
ON public.vaccination_sessions FOR DELETE
USING (auth.role() = 'authenticated');
```

---

## 🎯 Summary

**3 Core Tables:**
- ✅ barangays (6 columns)
- ✅ vaccine_requests (11 columns)
- ✅ vaccination_sessions (11 columns)

**Total:**
- 28 columns
- 9 foreign keys
- 15 indexes
- 20+ constraints
- 15+ RLS policies

---

**Last Updated:** November 20, 2025  
**Status:** Ready for Production
