# Quick Component Reference Guide

## 🎯 Find Components by Feature

### Vaccination Schedule (Health Worker)
**Location:** `components/vaccination-schedule/`

| Component | Purpose |
|-----------|---------|
| `ScheduleSessionModal.jsx` | Create new vaccination session |
| `ScheduleConfirmationModal.jsx` | Success confirmation after creating session |
| `EditSessionModal.jsx` | Edit existing session details |
| `UpdateAdministeredModal.jsx` | Update administered count and status |
| `SessionCalendar.jsx` | Calendar view of sessions |
| `SessionsContainer.jsx` | Container for table/card views |
| `SessionsTable.jsx` | Desktop table view |
| `SessionsCardList.jsx` | Mobile card view |

**Usage:**
```javascript
import ScheduleSessionModal from "@/components/vaccination-schedule/ScheduleSessionModal";
```

---

### Vaccine Requests (Health Worker & Head Nurse)
**Location:** `components/vaccination-request/`

| Component | Purpose |
|-----------|---------|
| `VaccineRequestModal.jsx` | Create vaccine request form |
| `VaccineRequestDetailModal.jsx` | View request details |
| `VaccineRequestsTable.jsx` | List of requests with actions |
| `VaccineSummaryCards.jsx` | Summary statistics cards |
| `DeleteConfirmationModal.jsx` | Delete confirmation dialog |

**Usage:**
```javascript
import VaccineRequestModal from "@/components/vaccination-request/VaccineRequestModal";
```

---

### Barangay Management (Head Nurse)
**Location:** `components/barangay-management/`

| Component | Purpose |
|-----------|---------|
| `BarangayForm.jsx` | Create/edit barangay form |
| `BarangayCard.jsx` | Display barangay information |
| `DeleteConfirmDialog.jsx` | Delete confirmation dialog |

**Usage:**
```javascript
import BarangayForm from "@/components/barangay-management/BarangayForm";
```

---

### Inventory Management (Head Nurse)
**Location:** `components/inventory/`

| Component | Purpose |
|-----------|---------|
| `AddVaccine.jsx` | Add/edit vaccine form |
| `DeleteConfirm.jsx` | Delete confirmation dialog |

**Usage:**
```javascript
import AddVaccine from "@/components/inventory/AddVaccine";
```

---

### Shared Components (All Pages)
**Location:** `components/shared/`

| Component | Purpose |
|-----------|---------|
| `Header.jsx` | Top navigation header |
| `Sidebar.jsx` | Left sidebar navigation |
| `SearchBar.jsx` | Reusable search input |

**Usage:**
```javascript
import Header from "@/components/shared/Header";
```

---

### Dialogs (Reusable)
**Location:** `components/dialogs/`

| Component | Purpose |
|-----------|---------|
| `ConfirmDialog.jsx` | Generic confirmation dialog |

**Usage:**
```javascript
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
```

---

### UI Components (shadcn/ui)
**Location:** `components/ui/`

All shadcn/ui components (button, input, dialog, etc.)

**Usage:**
```javascript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
```

---

## 📍 Find Components by Page

### Health Worker - Vaccination Schedule
**Path:** `app/pages/Health_Worker/vaccination_schedule/page.jsx`

**Uses:**
- `components/shared/Header`
- `components/shared/Sidebar`
- `components/shared/SearchBar`
- `components/vaccination-schedule/*` (all 8 components)
- `components/dialogs/ConfirmDialog`

---

### Health Worker - Vaccination Request
**Path:** `app/pages/Health_Worker/vaccination_request/page.jsx`

**Uses:**
- `components/shared/Header`
- `components/shared/Sidebar`
- `components/vaccination-request/VaccineRequestModal`
- `components/vaccination-request/VaccineRequestsTable`
- `components/vaccination-request/VaccineSummaryCards`

---

### Health Worker - Inventory
**Path:** `app/pages/Health_Worker/inventory/page.jsx`

**Uses:**
- `components/shared/Header`
- `components/shared/Sidebar`

---

### Head Nurse - Barangay Management
**Path:** `app/pages/Head_Nurse/barangay-management/page.jsx`

**Uses:**
- `components/shared/Header`
- `components/shared/Sidebar`
- `components/barangay-management/BarangayForm`
- `components/barangay-management/BarangayCard`
- `components/barangay-management/DeleteConfirmDialog`

---

### Head Nurse - Vaccination Request
**Path:** `app/pages/Head_Nurse/vaccination_request/page.jsx`

**Uses:**
- `components/shared/Header`
- `components/shared/Sidebar`
- `components/vaccination-request/VaccineRequestsTable`
- `components/vaccination-request/VaccineSummaryCards`

---

### Head Nurse - Inventory
**Path:** `app/pages/Head_Nurse/inventory/page.jsx`

**Uses:**
- `components/shared/Header`
- `components/shared/Sidebar`
- `components/inventory/AddVaccine`
- `components/inventory/DeleteConfirm`

---

### Settings/Privacy
**Path:** `app/pages/settings-privacy/page.jsx`

**Uses:**
- `components/shared/Header`
- `components/shared/Sidebar`

---

## 🔍 How to Find a Component

1. **Know the feature?** → Go to that feature folder
   - Vaccination Schedule → `components/vaccination-schedule/`
   - Vaccine Requests → `components/vaccination-request/`
   - Barangay Management → `components/barangay-management/`
   - Inventory → `components/inventory/`

2. **Know the page?** → Check the page file imports
   - Open the page file
   - Look at the import statements
   - Follow the path to the component

3. **Need a shared component?** → Check `components/shared/`
   - Header, Sidebar, SearchBar

4. **Need a UI component?** → Check `components/ui/`
   - Button, Input, Dialog, etc.

---

## ✅ Verification

All components are organized and import paths are updated. If you see a "Module not found" error:

1. Check the component name in the error
2. Find it in this guide
3. Use the correct import path
4. Clear `.next` folder and restart dev server

---

## 📝 Adding New Components

When creating a new component:

1. Identify which feature it belongs to
2. Create file in the appropriate folder
3. Use the correct import path

**Example:**
```javascript
// New component for vaccination schedule
// File: components/vaccination-schedule/NewComponent.jsx

// Import in page:
import NewComponent from "@/components/vaccination-schedule/NewComponent";
```
