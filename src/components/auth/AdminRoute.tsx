'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { userProfile, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!userProfile || !userProfile.is_Admin)) {
      router.push('/');
    }
  }, [userProfile, loading, router]);

  if (loading || !userProfile || !userProfile.is_Admin) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return <>{children}</>;
}
