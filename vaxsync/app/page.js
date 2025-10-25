import { redirect } from 'next/navigation';

export default function Home() {
  // Default redirect to dashboard (role-based routing)
  redirect('/head-nurse');
}
