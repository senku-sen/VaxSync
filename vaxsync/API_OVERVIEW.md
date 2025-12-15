# VaxSync – API Overview

This document summarizes:

- Internal Next.js API routes under `app/api`
- Core library modules that wrap Supabase
- How authentication and database access are handled

---

## 1. External APIs / Services

### 1.1 Supabase Anonymous Client (`lib/supabase.js`)

- **Purpose**: Main client for normal authenticated/anon users (respects RLS).
- **Creation**:
  - `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`
- **Used by** (examples):
  - `lib/vaccine.js` (CRUD on `vaccines`)
  - `lib/barangayVaccineInventory.js` (read/write barangay inventory)
  - `lib/accAuth.js` (auth, profiles)
  - Many pages/components for data fetching

**Key interactions:**

- **Auth**:
  - `supabase.auth.signUp(...)`
  - `supabase.auth.signOut()`
- **Database**:
  - `from('user_profiles')`, `from('vaccines')`, `from('barangay_vaccine_inventory')`, etc.

### 1.2 Supabase Admin Client (`lib/supabaseAdmin.js`)

- **Purpose**: Server-side admin client with service role key, bypasses RLS.
- **Env**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY`)
- **Exports**:
  - `supabaseAdmin`
  - `hasSupabaseAdmin` (boolean)

**Used by**:

- `app/api/inventory/deduct/route.js` – inventory updates through RLS-sensitive tables.
- Some admin logic (user deletion, monthly report fix endpoints, etc. where needed).

### 1.3 Auth Helpers (`lib/accAuth.js`)

- **checkAuth() / requireAuth()**
  - Reads `localStorage.vaxsync_user` to determine current user.
  - Client-side redirect to `/pages/signin` if not authenticated.
- **getUserProfile(userId)**
  - Fetches `user_profiles` row.
  - Optionally fetches `barangays` row for `assigned_barangay_id`.
- **logout()**
  - `supabase.auth.signOut()`
  - Clears `vaxsync_user`
  - Redirects to `/pages/signin`

---

## 2. Internal API Routes (`app/api`)

Below is a concise list of routes and their main responsibilities.

### 2.1 Authentication & User Management

#### `/api/signup` (`app/api/signup/route.js`)

- **Methods**:
  - `GET`: Check if an email is already used.
    - Query: `email`
    - Checks `user_profiles` table.
  - `POST`: Register a new user.
    - Body includes `firstName`, `lastName`, `email`, `password`, DOB fields, `sex`, `address`, `userRole`, `authCode`.
    - Validates required fields and role-specific `authCode`.
    - Uses `supabase.auth.signUp` with metadata + email redirect.
    - Optionally uses service-role client to clean auto-created `user_profiles`.
- **Tables/Services**:
  - Supabase Auth (users)
  - `user_profiles`

#### `/api/auth/callback` (`app/api/auth/callback/route.js`)

- **Method**: `GET`
- **Responsibility**:
  - Handles email verification callback from Supabase.
  - Can be called with:
    - `token_hash` + `type=email` (OTP verification)
    - Or `user_id`, `email`, `type` (admin flow)
  - If service-role key available:
    - Uses `supabase.auth.admin.getUserById` to confirm email.
    - Creates `user_profiles` entry if missing, using `user_metadata.profile_data` or individual metadata fields.
  - Redirects back to `/pages/signin` with appropriate query params (`verified`, `error`).
- **Tables**:
  - `user_profiles`
- **External API**:
  - Supabase Auth (admin + verifyOtp)

#### `/api/auth/signin` (`app/api/auth/signin/route.js`)

- **Likely responsibilities** (based on pattern; not shown in snippet):
  - Handling email/password sign-in or magic link OTP.
  - Creating and returning a session token / user info.
  - Setting `vaxsync_user` on the client side.

#### `/api/users` (`app/api/users/route.js`)

- **Method**: `DELETE`
- **Purpose**: Admin "Delete user" from User Management.
- **Flow**:
  - Validates `id`.
  - Uses admin client via `createSupabaseAdminClient()`.
  - Optionally clears `barangays.assigned_health_worker_id` referencing this user.
  - Deletes from `user_profiles`.
  - Handles FK constraint errors and missing service-role key with detailed messages.
- **Tables**:
  - `user_profiles`
  - `barangays`

#### `/api/users/[id]` & `/api/users.js`

- Likely legacy/utility files for user fetch/update; refer to them if you need exact REST behavior.

---

### 2.2 Residents

#### `/api/residents` (`app/api/residents/route.js`)

- **Methods**:
  - `GET`: List residents.
    - Query: `status`, `search`, `barangay`
  - `PUT`: Update resident record.
  - `PATCH`: Approve / reject resident (e.g., `action: 'approve' | 'reject'`).
  - `DELETE`: Delete resident (by `id`).
- **Tables**:
  - `residents` (and possibly related tables for status).

#### `/api/residents/upload` (`app/api/residents/upload/route.js`)

- **Method**: `POST`
- **Purpose**: CSV upload to create multiple residents.
- **Tables**:
  - `residents`

#### `/api/session-beneficiaries` (`app/api/session-beneficiaries/route.js`)

- **Methods**:
  - `POST`: Create beneficiary record.
    - Supports `session_id` nullable and `vaccine_name` for custom vaccines.
  - `GET`: Fetch beneficiaries by `session_id` and/or `resident_id`.
  - `DELETE`: Delete specific beneficiary by `id`.
- **Tables**:
  - `session_beneficiaries`

---

### 2.3 Vaccination Sessions & Inventory

#### `/api/vaccination-sessions` (`app/api/vaccination-sessions/route.js`)

- **Purpose**:
  - CRUD operations for `vaccination_sessions`.
  - Likely filtering by date, barangay, status for schedule pages.

#### `/api/session` (`app/api/session/route.js`)

- **Likely**: A more generic session endpoint (metadata / summary / simple CRUD).

#### `/api/inventory/deduct` (`app/api/inventory/deduct/route.js`)

- **Method**: `POST`
- **Body**:
  - `barangayId`
  - `vaccineId` (doses record)
  - `quantityToDeduct` (doses)
- **Flow**:
  - Logs deduction request.
  - Calls `deductBarangayVaccineInventory(barangayId, vaccineId, quantityToDeduct)` from `lib/barangayVaccineInventory`.
  - Returns `{ success, deductedRecords }` or error.
- **Tables**:
  - `barangay_vaccine_inventory`
  - Possibly `vaccine_doses` / `vaccines` inside helper.

#### `/api/inventory/fix-reserved` (`app/api/inventory/fix-reserved/route.js`)

- **Likely**: Maintenance endpoint to fix reserved_vial inconsistencies based on session data.

---

### 2.4 Barangays & Dashboard

#### `/api/barangays` (`app/api/barangays/route.js`)

- **Method**: `GET`
- **Purpose**:
  - Used by Head Nurse user management to fetch barangay list.
  - Returns `{ value: id, label: name }` style objects.
- **Table**:
  - `barangays`

#### `/api/dashboard` (`app/api/dashboard/route.js`)

- **Purpose**:
  - Backend for dashboard summary cards and charts.
- **Likely data**:
  - Counts for sessions, residents, completion rates, etc.
- **Tables**:
  - `vaccination_sessions`
  - `residents`
  - `vaccines`
  - `barangays`

#### `/api/health-check` (`app/api/health-check/route.js`)

- **Purpose**:
  - Simple health/status endpoint for debugging and uptime checks.

---

### 2.5 Vaccines & Monthly Reports

#### `/api/vaccines` (`app/api/vaccines/route.js`)

- **Methods**:
  - Typical CRUD for vaccine master data.
- **Tables**:
  - `vaccines`
  - Maybe `vaccine_doses` for dose-level details.

Related helper: `lib/vaccine.js`:

- `fetchVaccines()`, `getVaccineById(id)`, `createVaccine(data)`, `updateVaccine(id, data)`, `deleteVaccine(id)` – all via Supabase.

#### `/api/monthly-reports` (`app/api/monthly-reports/route.js`)

- **Purpose**:
  - Create / fetch / update `vaccine_monthly_report` rows.
  - Auto-calc `ending_inventory` based on:
    - Initial, Supplied (IN), Used (OUT), Wastage.
- **Tables**:
  - `VaccineMonthlyReport`
  - `VaccineMonthlyReportWithDetails`
  - `Vaccines`, `BarangayVaccineInventory`, `VaccinationSessions`

Supporting library: `lib/vaccineMonthlyReport.js` (complex logic for:

- Initial inventory
- IN / OUT columns
- Wastage
- Stock %)

---

### 2.6 Reporting APIs (`/api/reports/...`)

Used by Head Nurse Reports page.

#### `/api/reports/daily` (`app/api/reports/daily/route.js`)

- **Query**: `date=YYYY-MM-DD`
- **Data**:
  - Sessions and doses for a given day.
- **Tables**:
  - `vaccination_sessions`
  - `session_beneficiaries`

#### `/api/reports/weekly` (`app/api/reports/weekly/route.js`)

- **Query**: `week_start=YYYY-MM-DD`
- **Data**:
  - Aggregated sessions and doses across the week.
- **Tables**:
  - `vaccination_sessions`

#### `/api/reports/monthly` (`app/api/reports/monthly/route.js`)

- **Query**: `month=YYYY-MM-01`
- **Data**:
  - Per-vaccine/month stats (sessions, target, administered, rates).
- **Tables**:
  - `vaccination_sessions`
  - `session_beneficiaries`

#### `/api/reports/barangay` (`app/api/reports/barangay/route.js`)

- **Query**: `barangay_id`
- **Data**:
  - Barangay-specific stats.
- **Tables**:
  - `barangays`
  - `vaccination_sessions`
  - `residents` (for coverage rates)

#### `/api/reports/summary` (`app/api/reports/summary/route.js`)

- **Query**: `months=4` (or similar)
- **Data**:
  - Total doses administered
  - Completed sessions
  - Overall vaccination rate for last N months.

---

## 3. Summary of Library Modules Tied to APIs

A few core libs that "wrap" Supabase/API behavior:

- **`lib/barangayVaccineInventory.js`**
  - Fetch/add/update/deduct/reserve/release barangay inventory.
  - Uses `supabase` and `supabaseAdmin`.
  - Uses `VACCINE_VIAL_MAPPING` for vial-to-dose calculations.

- **`lib/vaccinationSession.js`**
  - High-level operations:
    - Create/update/delete sessions.
    - `updateSessionStatus` (includes inventory restoration).
    - Works with `barangay_vaccine_inventory`, `vaccine_doses`, `vaccines`.

- **`lib/vaccineRequest.js` / `lib/vaccineRequestToInventory.js`**
  - Approve vaccine requests and move doses between barangays.
  - Uses both source and destination barangay IDs.
  - Integrates with inventory tables.

- **`lib/sessionBeneficiaries.js`**
  - Manage beneficiaries and keep resident vaccine status in sync.

---

## 4. How to Use This Document

- **Backend dev**:
  - Use this as a map to find the right API route or lib when changing behavior.
- **Frontend dev**:
  - Use it to know which endpoints to call, and what they generally return.
- **Ops / Admin**:
  - See where service-role keys are required (`supabaseAdmin`) and which endpoints are sensitive to RLS.

---

## 5. Supabase API Methods Used

This section documents all Supabase JavaScript SDK methods used throughout VaxSync.

### 5.1 Authentication Methods

**`supabase.auth.signUp()`**
- **Used in**: `/api/signup/route.js`
- **Purpose**: Register new user with email and password
- **Example**:
  ```javascript
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      emailRedirectTo: callbackUrl,
      data: { first_name, last_name, date_of_birth, sex, address, user_role }
    }
  });
  ```

**`supabase.auth.signOut()`**
- **Used in**: `lib/accAuth.js`, components (Header, etc.)
- **Purpose**: Log out current user
- **Example**:
  ```javascript
  await supabase.auth.signOut();
  ```

**`supabase.auth.verifyOtp()`**
- **Used in**: `/api/auth/callback/route.js`
- **Purpose**: Verify email OTP token for email confirmation
- **Example**:
  ```javascript
  const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash,
    type: 'email'
  });
  ```

**`supabase.auth.admin.getUserById()`**
- **Used in**: `/api/auth/callback/route.js`
- **Purpose**: Get user details (requires admin/service-role key)
- **Example**:
  ```javascript
  const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);
  ```

---

### 5.2 Database Query Methods

#### SELECT (Read)

**`.select()`** – Fetch rows
- **Used in**: All pages, components, and libraries
- **Example**:
  ```javascript
  const { data, error } = await supabase
    .from('vaccines')
    .select('id, name, quantity_available')
    .order('name');
  ```

**`.eq()`** – Filter by exact match
- **Used in**: All query filters
- **Example**:
  ```javascript
  .eq('barangay_id', barangayId)
  .eq('vaccine_id', vaccineId)
  ```

**`.gte()` / `.lte()` / `.gt()` / `.lt()`** – Range filters
- **Used in**: Monthly reports, date-based queries
- **Example**:
  ```javascript
  .gte('created_at', startDateStr)
  .lte('created_at', endDateStr)
  ```

**`.in()`** – Filter by array of values
- **Used in**: Batch queries
- **Example**:
  ```javascript
  .in('id', [id1, id2, id3])
  ```

**`.maybeSingle()`** – Return single row or null (no error if not found)
- **Used in**: Optional lookups
- **Example**:
  ```javascript
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  ```

**`.single()`** – Return single row (error if not found)
- **Used in**: Required lookups
- **Example**:
  ```javascript
  const { data: vaccine } = await supabase
    .from('vaccines')
    .select('*')
    .eq('id', vaccineId)
    .single();
  ```

**`.order()`** – Sort results
- **Used in**: Lists and reports
- **Example**:
  ```javascript
  .order('created_at', { ascending: false })
  ```

**`.limit()`** – Limit number of rows
- **Used in**: Pagination
- **Example**:
  ```javascript
  .limit(10)
  ```

**`.range()`** – Pagination with offset
- **Used in**: Pagination
- **Example**:
  ```javascript
  .range(0, 9)  // First 10 rows
  ```

---

#### INSERT (Create)

**`.insert()`** – Add new rows
- **Used in**: Creating residents, sessions, beneficiaries, etc.
- **Example**:
  ```javascript
  const { data, error } = await supabase
    .from('residents')
    .insert([{
      name: 'John Doe',
      barangay_id: barangayId,
      date_of_birth: '2020-01-15'
    }])
    .select();
  ```

---

#### UPDATE (Modify)

**`.update()`** – Modify existing rows
- **Used in**: Updating residents, sessions, inventory, etc.
- **Example**:
  ```javascript
  const { data, error } = await supabase
    .from('barangay_vaccine_inventory')
    .update({ quantity_vial: newQuantity })
    .eq('id', inventoryId)
    .select();
  ```

---

#### DELETE (Remove)

**`.delete()`** – Remove rows
- **Used in**: Deleting residents, sessions, users, etc.
- **Example**:
  ```javascript
  const { data, error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', userId)
    .select();
  ```

---

### 5.3 Real-Time Subscriptions

**`.on()`** – Subscribe to database changes
- **Used in**: Notification pages, dashboard updates
- **Example**:
  ```javascript
  const subscription = supabase
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'vaccination_sessions' },
      (payload) => {
        console.log('Change received!', payload);
      }
    )
    .subscribe();
  ```

---

### 5.4 Storage Methods

**`.from(bucket).upload()`** – Upload file
- **Used in**: Photo uploads, CSV imports
- **Example**:
  ```javascript
  const { data, error } = await supabase.storage
    .from('session-photos')
    .upload(`${sessionId}/${fileName}`, file);
  ```

**`.from(bucket).getPublicUrl()`** – Get public URL
- **Used in**: Displaying photos
- **Example**:
  ```javascript
  const { data } = supabase.storage
    .from('session-photos')
    .getPublicUrl(filePath);
  ```

**`.from(bucket).remove()`** – Delete file
- **Used in**: Cleaning up photos
- **Example**:
  ```javascript
  await supabase.storage
    .from('session-photos')
    .remove([filePath]);
  ```

---

## 6. Quick Reference: Key Tables & Their APIs

| Table | Main API Route | Library Helper | Purpose |
|-------|---|---|---|
| `user_profiles` | `/api/signup`, `/api/auth/callback`, `/api/users` | `lib/accAuth.js` | User accounts & roles |
| `barangays` | `/api/barangays` | – | Barangay master data |
| `residents` | `/api/residents` | – | Resident records |
| `vaccines` | `/api/vaccines` | `lib/vaccine.js` | Vaccine master data |
| `vaccination_sessions` | `/api/vaccination-sessions` | `lib/vaccinationSession.js` | Session scheduling & tracking |
| `session_beneficiaries` | `/api/session-beneficiaries` | `lib/sessionBeneficiaries.js` | Resident attendance & vaccination status |
| `barangay_vaccine_inventory` | `/api/inventory/deduct` | `lib/barangayVaccineInventory.js` | Barangay stock tracking |
| `vaccine_monthly_report` | `/api/monthly-reports` | `lib/vaccineMonthlyReport.js` | Monthly statistics & reporting |
| `vaccine_requests` | (via lib) | `lib/vaccineRequest.js` | Vaccine request approval workflow |

---

**Last Updated**: Dec 10, 2025  
**Project**: VaxSync – Vaccine Inventory & Vaccination Program Management System
