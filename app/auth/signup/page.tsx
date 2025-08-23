import { AuthForm } from '@/components/auth/auth-form';

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <AuthForm type="signup" />
      </div>
    </div>
  );
}