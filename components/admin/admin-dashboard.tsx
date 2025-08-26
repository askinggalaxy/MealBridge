'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Flag, Users, Package, Ban, Check, Trash2, Edit3, Save, XCircle, Search } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
// removed unused Textarea import

type Flag = Database['public']['Tables']['flags']['Row'] & {
  reporter: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'display_name' | 'avatar_url'>;
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
  // Admin data for management tabs
  const [users, setUsers] = useState<Database['public']['Tables']['profiles']['Row'][]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const [donations, setDonations] = useState<Database['public']['Tables']['donations']['Row'][]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [editingDonationId, setEditingDonationId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  // Detail panel state: which donation to show in a modal with images and quick actions.
  const [detailDonation, setDetailDonation] = useState<Database['public']['Tables']['donations']['Row'] | null>(null);
  // When a detail donation is open, we also load the donor public profile to show a link
  const [detailDonor, setDetailDonor] = useState<Pick<Database['public']['Tables']['profiles']['Row'],'id'|'display_name'|'avatar_url'>|null>(null);
  // Pagination + sorting state for donations list.
  const [page, setPage] = useState(1); // 1-based page index for UX.
  const [pageSize, setPageSize] = useState(10);
  const [totalDonationsCount, setTotalDonationsCount] = useState(0);
  const [sortField, setSortField] = useState<'created_at' | 'updated_at' | 'status' | 'title'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const supabase = createClient();

  useEffect(() => {
    // Load overall stats/flags, plus initial users and donations lists
    loadData();
    loadUsers();
    loadDonations();
  }, []);

  // Auto-reload donations when pagination/sorting changes
  useEffect(() => {
    loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortField, sortDir]);

  const loadData = async () => {
    setLoading(true);

    // Load flags
    const { data: flagsData } = await supabase
      .from('flags')
      .select(`
        *,
        reporter:profiles!flags_reporter_id_fkey (
          id,
          display_name,
          avatar_url
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

  // Load donor profile by id for the detail modal
  const loadDonorProfile = async (donorId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', donorId)
      .maybeSingle();
    setDetailDonor(data as any);
  };

  // --- Flag actions helpers (for donation targets) ---
  // Fetch a donation row by id for admin actions (delete/ban/view)
  // We explicitly select fields used in the detail modal and coerce `images` to a string[]
  // to handle edge cases where the DB might return null or JSON text.
  const getDonationById = async (donationId: string) => {
    const { data, error } = await supabase
      .from('donations')
      .select(
        [
          'id',
          'donor_id',
          'title',
          'description',
          'status',
          'updated_at',
          'images',
          'category_id',
          'quantity',
          'expiry_date',
          'pickup_window_start',
          'pickup_window_end',
          'address_text',
          'location_lat',
          'location_lng',
          'is_hidden',
        ].join(',')
      )
      .eq('id', donationId)
      .maybeSingle();
    if (error || !data) return null;
    // Normalize images to a string[]
    let imgs: string[] = [];
    const raw = (data as any).images;
    if (Array.isArray(raw)) {
      imgs = raw.filter((u) => typeof u === 'string');
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) imgs = parsed.filter((u) => typeof u === 'string');
      } catch {}
    }
    const base = data as unknown as Database['public']['Tables']['donations']['Row'];
    const merged: Database['public']['Tables']['donations']['Row'] = {
      ...base,
      images: imgs,
    };
    return merged;
  };

  // Delete donation by id (loads full row first to reuse existing delete flow incl. storage cleanup)
  const deleteFlaggedDonation = async (donationId: string) => {
    const row = await getDonationById(donationId);
    if (!row) {
      toast.error('Donation not found');
      return;
    }
    await deleteDonation(row);
    // Refresh flags stats after deletion
    loadData();
  };

  // Ban the donor owner of a donation
  const banDonorForDonation = async (donationId: string) => {
    const row = await getDonationById(donationId);
    if (!row) {
      toast.error('Donation not found');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', row.donor_id);
    if (error) {
      toast.error('Failed to ban donor');
      return;
    }
    toast.success('Donor banned');
    loadUsers();
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

  /**
   * Quickly set the status of a donation from the detail panel.
   */
  const setDonationStatus = async (donationId: string, status: Database['public']['Tables']['donations']['Row']['status']) => {
    const { error } = await supabase
      .from('donations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', donationId);
    if (error) {
      toast.error('Failed to update status');
      return;
    }
    toast.success('Status updated');
    // Refresh both lists and detail panel state
    await loadDonations();
    if (detailDonation && detailDonation.id === donationId) {
      setDetailDonation({ ...detailDonation, status, updated_at: new Date().toISOString() });
    }
  };

  // --- Users management helpers ---
  const loadUsers = async () => {
    setUsersLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (userSearch.trim()) {
      query = query.or(`display_name.ilike.%${userSearch}%,phone.ilike.%${userSearch}%`);
    }
    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load users');
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setUsersLoading(false);
  };

  const toggleBan = async (userId: string, next: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_banned: next }).eq('id', userId);
    if (error) {
      toast.error('Failed to update user ban');
    } else {
      toast.success(next ? 'User banned' : 'User unbanned');
      loadUsers();
    }
  };

  // --- Donations management helpers ---
  /**
   * Load donations with pagination and sorting.
   * We request an exact count and only the current page via .range().
   */
  const loadDonations = async () => {
    setDonationsLoading(true);
    // Calculate range (Supabase is 0-based inclusive range)
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('donations')
      .select('*', { count: 'exact' })
      .order(sortField, { ascending: sortDir === 'asc' })
      .range(from, to);
    if (error) {
      toast.error('Failed to load donations');
      setDonations([]);
      setTotalDonationsCount(0);
    } else {
      setDonations(data || []);
      setTotalDonationsCount(count || 0);
    }
    setDonationsLoading(false);
  };

  const startEditDonation = (d: Database['public']['Tables']['donations']['Row']) => {
    setEditingDonationId(d.id);
    setEditTitle(d.title);
    setEditDescription(d.description);
  };

  const saveDonationEdits = async (donationId: string) => {
    const { error } = await supabase
      .from('donations')
      .update({ title: editTitle.trim(), description: editDescription.trim(), updated_at: new Date().toISOString() })
      .eq('id', donationId);
    if (error) {
      toast.error('Failed to update donation');
      return;
    }
    toast.success('Donation updated');
    setEditingDonationId(null);
    await loadDonations();
  };

  const setDonationHidden = async (donationId: string, hidden: boolean) => {
    const { error } = await supabase.from('donations').update({ is_hidden: hidden }).eq('id', donationId);
    if (error) {
      toast.error('Failed to update visibility');
    } else {
      toast.success(hidden ? 'Donation hidden' : 'Donation unhidden');
      loadDonations();
    }
  };

  const deleteDonation = async (d: Database['public']['Tables']['donations']['Row']) => {
    // Attempt to remove storage objects derived from public URLs
    try {
      const paths = (d.images || [])
        .map((url) => {
          const idx = url.indexOf('/storage/v1/object/public/donation-images/');
          if (idx === -1) return null;
          return url.substring(idx + '/storage/v1/object/public/donation-images/'.length);
        })
        .filter(Boolean) as string[];
      if (paths.length) {
        await supabase.storage.from('donation-images').remove(paths);
      }
    } catch (e) {
      console.warn('Failed to remove some images from storage', e);
    }

    const { error } = await supabase.from('donations').delete().eq('id', d.id);
    if (error) {
      toast.error('Failed to delete donation');
    } else {
      toast.success('Donation deleted');
      loadDonations();
      // Close detail modal if it was open for this donation
      if (detailDonation && detailDonation.id === d.id) {
        setDetailDonation(null);
      }
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
          <TabsTrigger value="donations">Donations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
                <p className="text-gray-500">No flags found</p>
              ) : (
                <div className="space-y-3">
                  {flags.map((flag) => (
                    <div key={flag.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={flag.status === 'pending' ? 'destructive' : 'secondary'}>
                              {flag.status}
                            </Badge>
                            <span className="text-xs text-gray-500">{new Date(flag.created_at).toLocaleString()}</span>
                          </div>
                          <div className="mt-1 text-sm">
                            <span className="font-medium">{flag.reason}</span> • Reported by{' '}
                            {flag.reporter?.id ? (
                              <Link href={`/users/${flag.reporter.id}`} className="underline hover:no-underline">
                                {flag.reporter.display_name}
                              </Link>
                            ) : (
                              <span>user</span>
                            )}
                          </div>
                          {flag.description && (
                            <div className="text-sm text-gray-700 mt-1">{flag.description}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Target: {flag.target_type} • ID: {flag.target_id}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
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
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const row = await getDonationById(flag.target_id);
                                    if (row) {
                                      setDetailDonation(row);
                                      loadDonorProfile(row.donor_id);
                                    } else {
                                      toast.error('Donation not found');
                                    }
                                  }}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteFlaggedDonation(flag.target_id)}
                                >
                                  Delete donation
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => banDonorForDonation(flag.target_id)}
                                >
                                  Ban donor
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => hideDonation(flag.target_id)}
                                >
                                  Hide donation
                                </Button>
                              </>
                            )}
                          </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Donations management */}
        <TabsContent value="donations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Donations</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Sorting controls: choose field + direction. We keep it simple and explicit. */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by</span>
                  <Button size="sm" variant={sortField === 'created_at' ? 'secondary' : 'outline'} onClick={() => setSortField('created_at')}>created_at</Button>
                  <Button size="sm" variant={sortField === 'updated_at' ? 'secondary' : 'outline'} onClick={() => setSortField('updated_at')}>updated_at</Button>
                  <Button size="sm" variant={sortField === 'status' ? 'secondary' : 'outline'} onClick={() => setSortField('status')}>status</Button>
                  <Button size="sm" variant={sortField === 'title' ? 'secondary' : 'outline'} onClick={() => setSortField('title')}>title</Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Direction</span>
                  <Button size="sm" variant={sortDir === 'desc' ? 'secondary' : 'outline'} onClick={() => setSortDir('desc')}>desc</Button>
                  <Button size="sm" variant={sortDir === 'asc' ? 'secondary' : 'outline'} onClick={() => setSortDir('asc')}>asc</Button>
                </div>
              </div>

              {/* Donations list. We show minimal info + inline actions. */}
              {donationsLoading ? (
                <div className="space-y-3">{[...Array(6)].map((_, i) => (<div key={i} className="animate-pulse bg-gray-200 h-12 rounded" />))}</div>
              ) : donations.length === 0 ? (
                <Alert><AlertDescription>No donations found</AlertDescription></Alert>
              ) : (
                <div className="space-y-2">
                  {donations.map((d) => (
                    <div key={d.id} className="p-3 border rounded">
                      <div className="flex items-start justify-between gap-3">
                        {/* Left: title + meta */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[40ch]" title={d.title}>{d.title}</span>
                            <Badge variant="outline">{d.status}</Badge>
                            {d.is_hidden && <Badge variant="destructive">hidden</Badge>}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Created: {new Date(d.created_at).toLocaleString()} • Updated: {new Date(d.updated_at).toLocaleString()}
                          </div>
                        </div>
                        {/* Right: actions */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          {/* View details modal to see images and quick status */}
                          <Button size="sm" variant="outline" onClick={async () => { setDetailDonation(d); loadDonorProfile(d.donor_id); }}>View</Button>
                          {editingDonationId === d.id ? (
                            <>
                              {/* Save button appears if editing; actual inputs appear below. */}
                              <Button size="sm" onClick={() => saveDonationEdits(d.id)}>
                                <Save className="h-4 w-4 mr-1" /> Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingDonationId(null)}>
                                <XCircle className="h-4 w-4 mr-1" /> Cancel
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEditDonation(d)}>
                              <Edit3 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                          )}
                          <Button size="sm" variant={d.is_hidden ? 'secondary' : 'outline'} onClick={() => setDonationHidden(d.id, !d.is_hidden)}>
                            {d.is_hidden ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                            {d.is_hidden ? 'Unhide' : 'Hide'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteDonation(d)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                      {/* Inline edit form for title/description when editing this donation. We keep it minimal. */}
                      {editingDonationId === d.id && (
                        <div className="mt-2 space-y-2">
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                          <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" />
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Pagination controls for donations list */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-gray-600">
                      Page {page} of {Math.max(1, Math.ceil(totalDonationsCount / pageSize))} • Total {totalDonationsCount}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page <= 1}
                        onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
                      >
                        Prev
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= Math.ceil(totalDonationsCount / pageSize)}
                        onClick={() => { setPage((p) => p + 1); }}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users management */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name or phone" />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadUsers}>Search</Button>
                  <Button variant="secondary" onClick={() => { setUserSearch(''); loadUsers(); }}>Reset</Button>
                </div>
              </div>

              {usersLoading ? (
                <div className="space-y-3">{[...Array(6)].map((_, i) => (<div key={i} className="animate-pulse bg-gray-200 h-12 rounded" />))}</div>
              ) : users.length === 0 ? (
                <Alert><AlertDescription>No users found</AlertDescription></Alert>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="p-3 border rounded flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{u.display_name}</span>
                          <Badge variant="outline">{u.role}</Badge>
                          {u.is_banned && <Badge variant="destructive">banned</Badge>}
                          {u.is_verified && <Badge variant="secondary">verified</Badge>}
                        </div>
                        <div className="text-xs text-gray-500">Reputation: {u.reputation_score} ({u.reputation_count})</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={u.is_banned ? 'secondary' : 'destructive'} onClick={() => toggleBan(u.id, !u.is_banned)}>
                          {u.is_banned ? <Check className="h-4 w-4 mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Modal: Simple full-screen overlay with centered panel */}
      {detailDonation && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="font-semibold">Donation details</h3>
              <Button variant="ghost" size="sm" onClick={() => { setDetailDonation(null); setDetailDonor(null); }}>
                Close
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Title</span>
                  <span className="font-medium">{detailDonation.title}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{detailDonation.description}</div>
                <div className="text-xs text-gray-500 mt-1">Status: {detailDonation.status} • Updated {new Date(detailDonation.updated_at).toLocaleString()}</div>
                <div className="text-sm text-gray-700 mt-2">
                  <span className="text-gray-500">Donor:</span>{' '}
                  {detailDonor?.id ? (
                    <Link href={`/users/${detailDonor.id}`} className="underline hover:no-underline">
                      {detailDonor.display_name}
                    </Link>
                  ) : (
                    <span className="text-gray-600">{detailDonation.donor_id}</span>
                  )}
                </div>
              </div>
              {/* Image gallery: simple responsive grid */}
              {detailDonation.images && detailDonation.images.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Images</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {detailDonation.images.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                        <img src={url} alt={`donation-${idx}`} className="h-28 w-full object-cover rounded" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {/* Quick actions: status + visibility + delete */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Quick status</div>
                <div className="flex flex-wrap gap-2">
                  {(['available','reserved','picked_up','canceled','expired'] as Database['public']['Tables']['donations']['Row']['status'][]).map(st => (
                    <Button key={st} size="sm" variant={detailDonation.status === st ? 'secondary' : 'outline'} onClick={() => setDonationStatus(detailDonation.id, st)}>
                      {st}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant={detailDonation.is_hidden ? 'outline' : 'secondary'} onClick={() => setDonationHidden(detailDonation.id, !detailDonation.is_hidden)}>
                    {detailDonation.is_hidden ? 'Unhide' : 'Hide'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteDonation(detailDonation)}>
                    Delete
                  </Button>
                </div>
              </div>
              {/* Meta info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div><span className="text-gray-500">Category ID:</span> {detailDonation.category_id}</div>
                <div><span className="text-gray-500">Quantity:</span> {detailDonation.quantity}</div>
                <div><span className="text-gray-500">Expiry date:</span> {detailDonation.expiry_date}</div>
                <div><span className="text-gray-500">Pickup window:</span> {detailDonation.pickup_window_start} - {detailDonation.pickup_window_end}</div>
                <div><span className="text-gray-500">Address:</span> {detailDonation.address_text}</div>
                <div><span className="text-gray-500">Coords:</span> {detailDonation.location_lat}, {detailDonation.location_lng}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
