import { requireAuth, getProfile } from '@/lib/auth';
import ProfileForm from '@/components/profile/profile-form';
import { Header } from '@/components/layout/header';

export default async function ProfilePage() {
  // Ensure the user is authenticated (redirects to /auth/login if not)
  const user = await requireAuth();

  // Load profile for the authenticated user
  const profile = await getProfile();

  // If profile does not exist yet, redirect logic is handled elsewhere (/profile/setup).
  // Here we simply guard to avoid rendering issues.
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-xl font-semibold mb-4">Your Profile</h1>
          <ProfileForm profile={profile} email={user.email ?? ''} />
        </div>
      </main>
    </div>
  );
}
