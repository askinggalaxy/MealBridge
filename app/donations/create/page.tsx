import { requireAuth } from '@/lib/auth';
import { CreateDonationForm } from '@/components/donations/create-donation-form';
import { Header } from '@/components/layout/header';

export default async function CreateDonationPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Food</h1>
            <p className="text-gray-600">
              Help reduce food waste by sharing surplus food with your community.
            </p>
          </div>
          
          <CreateDonationForm />
        </div>
      </div>
    </div>
  );
}