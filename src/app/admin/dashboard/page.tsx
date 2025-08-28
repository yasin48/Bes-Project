import AdminRoute from '@/components/auth/AdminRoute';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const { data: events, error } = await supabaseAdmin.from('events').select('*');

  if (error) {
    console.error('Error fetching events:', error);
    return (
      <AdminRoute>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-red-500">Error fetching events.</p>
        </div>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 ">Admin Dashboard</h1>
        <AdminDashboardClient initialEvents={events || []} />
      </div>
    </AdminRoute>
  );
}
