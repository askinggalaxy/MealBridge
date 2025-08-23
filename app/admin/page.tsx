import { getProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default async function AdminPage() {
  const profile = await getProfile();
  
  if (!profile || !['ngo', 'admin'].includes(profile.role)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <AdminDashboard profile={profile} />
      </div>
    </div>
  );
}