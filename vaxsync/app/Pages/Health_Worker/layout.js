import DashboardLayout from '@/components/layout/DashboardLayout';

export const metadata = {
  title: 'Health Worker Dashboard - VaxSync',
  description: 'Vaccine inventory management system for Health Worker',
};

export default function HealthWorkerLayout({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}
