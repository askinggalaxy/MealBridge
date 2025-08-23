'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Flag, Users, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';

type Flag = Database['public']['Tables']['flags']['Row'] & {
  reporter: Database['public']['Tables']['profiles']['Row'];
};

interface AdminDashboardProps {
  profile: Database['public']['Tables']['profiles']['Row'];
}

export function AdminDashboard({ profile }: AdminDashboardProps) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    activeDonations: 0,
    pendingFlags: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load flags
    const { data: flagsData } = await supabase
      .from('flags')
      .select(`
        *,
        reporter:profiles!flags_reporter_id_fkey (
          display_name
        )
      `)
      .order('created_at', { ascending: false });

    if (flagsData) {
      setFlags(flagsData as Flag[]);
    }

    // Load stats
    const [usersResult, donationsResult, activeDonationsResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('donations').select('*', { count: 'exact', head: true }),
      supabase.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'available'),
    ]);

    setStats({
      totalUsers: usersResult.count || 0,
      totalDonations: donationsResult.count || 0,
      activeDonations: activeDonationsResult.count || 0,
      pendingFlags: flagsData?.filter(f => f.status === 'pending').length || 0,
    });

    setLoading(false);
  };

  const handleFlag = async (flagId: string, action: 'reviewed' | 'resolved') => {
    const { error } = await supabase
      .from('flags')
      .update({
        status: action,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', flagId);

    if (error) {
      toast.error('Failed to update flag');
    } else {
      toast.success(`Flag marked as ${action}`);
      loadData();
    }
  };

  const hideDonation = async (donationId: string) => {
    const { error } = await supabase
      .from('donations')
      .update({ is_hidden: true })
      .eq('id', donationId);

    if (error) {
      toast.error('Failed to hide donation');
    } else {
      toast.success('Donation hidden');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {profile.role === 'admin' ? 'Admin' : 'NGO'} Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor platform activity and ensure community safety.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDonations}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Donations</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDonations}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Flags</CardTitle>
            <Flag className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFlags}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="flags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flags">Content Flags</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Flags</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
                  ))}
                </div>
              ) : flags.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No flags to review</p>
              ) : (
                <div className="space-y-4">
                  {flags.map((flag) => (
                    <div key={flag.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={flag.status === 'pending' ? 'destructive' : 'secondary'}
                            >
                              {flag.status}
                            </Badge>
                            <Badge variant="outline">
                              {flag.target_type}
                            </Badge>
                            <Badge variant="outline">
                              {flag.reason}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Reported by:</strong> {flag.reporter.display_name}
                          </p>
                          
                          {flag.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              <strong>Description:</strong> {flag.description}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            Reported {new Date(flag.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        {flag.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFlag(flag.id, 'reviewed')}
                            >
                              Mark Reviewed
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleFlag(flag.id, 'resolved')}
                            >
                              Resolve
                            </Button>
                            {flag.target_type === 'donation' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => hideDonation(flag.target_id)}
                              >
                                Hide Item
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  User management features will be expanded in future versions. 
                  For now, use the flags system to report problematic users.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}