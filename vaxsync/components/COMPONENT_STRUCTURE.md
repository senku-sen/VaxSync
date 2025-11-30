# Component Organization Structure

## New Folder Organization

Components are now organized by feature/page for easier navigation:

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
└── ui/                              # shadcn/ui components (unchanged)
    ├── button.jsx
    ├── input.jsx
    ├── dialog.jsx
    └── ... (other UI components)
```

## Component Mapping

### Vaccination Schedule Page
- Location: `app/pages/Health_Worker/vaccination_schedule/page.jsx`
- Components: `components/vaccination-schedule/*`
- Shared: `components/shared/*`

### Vaccination Request Pages
- Health Worker: `app/pages/Health_Worker/vaccination_request/page.jsx`
- Head Nurse: `app/pages/Head_Nurse/vaccination_request/page.jsx`
- Components: `components/vaccination-request/*`
- Shared: `components/shared/*`

### Barangay Management Page
- Location: `app/pages/Head_Nurse/barangay-management/page.jsx`
- Components: `components/barangay-management/*`
- Shared: `components/shared/*`

### Inventory Pages
- Health Worker: `app/pages/Health_Worker/inventory/page.jsx`
- Head Nurse: `app/pages/Head_Nurse/inventory/page.jsx`
- Components: `components/inventory/*`
- Shared: `components/shared/*`

## Migration Steps

1. Create new folder structure
2. Move components to respective folders
3. Update import paths in all page files
4. Verify all imports work correctly
5. Delete old component files from root

## Benefits

✅ Easy to find components by feature
✅ Clear separation of concerns
✅ Reduced cognitive load when navigating
✅ Easier to add new features
✅ Better code organization
✅ Faster development workflow
