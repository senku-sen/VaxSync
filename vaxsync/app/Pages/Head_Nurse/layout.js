import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata = {
  title: 'Head Nurse Dashboard - VaxSync',
  description: 'Vaccine inventory management system for Head Nurse',
};

export default function HeadNurseLayout({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
