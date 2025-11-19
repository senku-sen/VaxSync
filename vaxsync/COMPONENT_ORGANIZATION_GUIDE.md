# Component Organization Guide

## Overview

Components have been reorganized into feature-based folders for better navigation and maintainability.

## New Folder Structure

```
components/
├── shared/                          # Shared across all pages
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   └── SearchBar.jsx
│
├── vaccination-schedule/            # Health Worker - Vaccination Schedule
│   ├── ScheduleSessionModal.jsx
│   ├── ScheduleConfirmationModal.jsx
│   ├── EditSessionModal.jsx
│   ├── UpdateAdministeredModal.jsx
│   ├── SessionCalendar.jsx
│   ├── SessionsContainer.jsx
│   ├── SessionsTable.jsx
│   └── SessionsCardList.jsx
│
├── vaccination-request/             # Health Worker & Head Nurse - Vaccine Requests
│   ├── VaccineRequestModal.jsx
│   ├── VaccineRequestDetailModal.jsx
│   ├── VaccineRequestsTable.jsx
│   └── VaccineSummaryCards.jsx
│
├── barangay-management/             # Head Nurse - Barangay Management
│   ├── BarangayForm.jsx
│   ├── BarangayCard.jsx
│   └── DeleteConfirmDialog.jsx
│
├── inventory/                       # Head Nurse - Inventory Management
│   ├── AddVaccine.jsx
│   └── DeleteConfirm.jsx
│
├── dialogs/                         # Reusable dialog components
│   └── ConfirmDialog.jsx
│
└── ui/                              # shadcn/ui components
```

## Quick Navigation

### Finding Components

1. **Vaccination Schedule Components** → Look in `components/vaccination-schedule/`
2. **Vaccine Request Components** → Look in `components/vaccination-request/`
3. **Barangay Management Components** → Look in `components/barangay-management/`
4. **Inventory Components** → Look in `components/inventory/`
5. **Shared Components** → Look in `components/shared/`
6. **Dialog Components** → Look in `components/dialogs/`
7. **UI Components** → Look in `components/ui/`

## Import Path Examples

### Shared Components
```javascript
import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import SearchBar from "@/components/shared/SearchBar";
```

### Vaccination Schedule
```javascript
import ScheduleSessionModal from "@/components/vaccination-schedule/ScheduleSessionModal";
import SessionCalendar from "@/components/vaccination-schedule/SessionCalendar";
```

### Vaccination Request
```javascript
import VaccineRequestModal from "@/components/vaccination-request/VaccineRequestModal";
import VaccineRequestsTable from "@/components/vaccination-request/VaccineRequestsTable";
```

### Barangay Management
```javascript
import BarangayForm from "@/components/barangay-management/BarangayForm";
import BarangayCard from "@/components/barangay-management/BarangayCard";
```

### Inventory
```javascript
import AddVaccine from "@/components/inventory/AddVaccine";
import DeleteConfirm from "@/components/inventory/DeleteConfirm";
```

### Dialogs
```javascript
import ConfirmDialog from "@/components/dialogs/ConfirmDialog";
```

## Benefits

✅ Easy to locate components by feature
✅ Clear separation of concerns
✅ Reduced cognitive load when navigating
✅ Easier to add new features
✅ Better code organization
✅ Faster development workflow
✅ Improved team collaboration

## Adding New Components

When creating a new component:

1. Identify which feature it belongs to
2. Create the file in the appropriate folder
3. Update imports in the page that uses it
4. Follow the existing naming conventions

Example: New component for vaccination schedule
```
components/vaccination-schedule/NewComponent.jsx
```

Then import it:
```javascript
import NewComponent from "@/components/vaccination-schedule/NewComponent";
```

## Migration Complete

All components have been reorganized and all import paths have been updated in:
- `app/pages/Health_Worker/vaccination_schedule/page.jsx`
- `app/pages/Health_Worker/vaccination_request/page.jsx`
- `app/pages/Health_Worker/inventory/page.jsx`
- `app/pages/Head_Nurse/barangay-management/page.jsx`
- `app/pages/Head_Nurse/vaccination_request/page.jsx`
- `app/pages/Head_Nurse/inventory/page.jsx`
- `app/pages/settings-privacy/page.jsx`
