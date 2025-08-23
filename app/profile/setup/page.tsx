import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfileSetupForm } from '@/components/profile/profile-setup-form';

export default async function ProfileSetupPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">
              Help others in your community get to know you and build trust.
            </p>
          </div>
          
          <ProfileSetupForm />
        </div>
      </div>
    </div>
  );
}