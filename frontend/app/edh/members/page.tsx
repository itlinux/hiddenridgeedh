'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { membersApi } from '@/lib/api';
import { ArrowLeft, Users, CheckCircle, Shield, UserX, Trash2, Loader2, Clock, XCircle, PauseCircle, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Member {
  id: string;
  full_name: string;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  role: string;
  is_active: boolean;
  is_approved: boolean;
  is_suspended?: boolean;
  created_at: string;
  latitude?: number;
  longitude?: number;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  content_admin: 'Content Admin',
  member: 'Member',
  pending: 'Pending',
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-gold-100 text-gold-700',
  content_admin: 'bg-forest-100 text-forest-700',
  member: 'bg-cream-200 text-forest-600',
  pending: 'bg-amber-50 text-amber-700',
};

export default function ManageMembersPage() {
  const { user, isSuperAdmin, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [pending, setPending] = useState<Member[]>([]);
  const [rejected, setRejected] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'pending' | 'rejected'>('all');

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/');
  }, [isLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    try {
      const [membersRes, pendingRes, rejectedRes] = await Promise.all([
        membersApi.list({ limit: 200, include_suspended: true }),
        isSuperAdmin ? membersApi.pending() : Promise.resolve({ data: { pending: [] } }),
        isSuperAdmin ? membersApi.rejected() : Promise.resolve({ data: { rejected: [] } }),
      ]);
      setMembers((membersRes.data.members || []).map((m: any) => ({ ...m, is_approved: true, is_active: true })));
      setPending((pendingRes.data.pending || []).map((m: any) => ({ ...m })));
      setRejected((rejectedRes.data.rejected || []).map((m: any) => ({ ...m })));
    } catch {
      setMembers([]);
      setPending([]);
      setRejected([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await membersApi.approve(userId);
      const approved = pending.find(p => p.id === userId) || rejected.find(r => r.id === userId);
      setPending(prev => prev.filter(p => p.id !== userId));
      setRejected(prev => prev.filter(r => r.id !== userId));
      if (approved) setMembers(prev => [{ ...approved, role: 'member', is_approved: true, is_active: true }, ...prev]);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await membersApi.reject(userId);
      const rejectedUser = pending.find(p => p.id === userId);
      setPending(prev => prev.filter(p => p.id !== userId));
      if (rejectedUser) setRejected(prev => [{ ...rejectedUser, role: 'rejected' }, ...prev]);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await membersApi.updateRole(userId, { role: newRole });
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleDeactivate = async (userId: string, name: string) => {
    if (!confirm(`Deactivate ${name}? They will lose access.`)) return;
    try {
      await membersApi.deactivate(userId);
      setMembers(prev => prev.filter(m => m.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to deactivate');
    }
  };

  const handleSuspend = async (userId: string, name: string) => {
    if (!confirm(`Suspend ${name}? They will lose access until unsuspended.`)) return;
    try {
      await membersApi.suspend(userId);
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, is_active: false, is_suspended: true } : m));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to suspend');
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      await membersApi.unsuspend(userId);
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, is_active: true, is_suspended: false } : m));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to unsuspend');
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Permanently delete ${name}? This cannot be undone. All their data will be removed.`)) return;
    try {
      await membersApi.delete(userId);
      setMembers(prev => prev.filter(m => m.id !== userId));
      setPending(prev => prev.filter(p => p.id !== userId));
      setRejected(prev => prev.filter(r => r.id !== userId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete');
    }
  };

  if (isLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/edh" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Users className="text-gold-400" size={24} />
            <h1 className="font-serif text-2xl text-cream-100">Manage Members</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          <button
            onClick={() => setTab('all')}
            className={`px-5 py-2 text-sm font-sans rounded-sm transition-colors ${tab === 'all' ? 'bg-forest-800 text-cream-100' : 'bg-cream-200 text-forest-600 hover:bg-cream-300'}`}
          >
            All Members ({members.length})
          </button>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setTab('pending')}
                className={`px-5 py-2 text-sm font-sans rounded-sm transition-colors flex items-center gap-2 ${tab === 'pending' ? 'bg-forest-800 text-cream-100' : 'bg-cream-200 text-forest-600 hover:bg-cream-300'}`}
              >
                Pending ({pending.length})
                {pending.length > 0 && <span className="w-2 h-2 bg-amber-500 rounded-full" />}
              </button>
              <button
                onClick={() => setTab('rejected')}
                className={`px-5 py-2 text-sm font-sans rounded-sm transition-colors flex items-center gap-2 ${tab === 'rejected' ? 'bg-forest-800 text-cream-100' : 'bg-cream-200 text-forest-600 hover:bg-cream-300'}`}
              >
                Rejected ({rejected.length})
              </button>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-forest-400" size={32} /></div>
        ) : tab === 'pending' ? (
          pending.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="text-forest-400 mx-auto mb-3" size={32} />
              <p className="text-forest-400 font-body">No pending approvals</p>
            </div>
          ) : (
            <div className="card divide-y divide-cream-100">
              {pending.map((m) => (
                <div key={m.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center">
                      <Clock size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <div className="font-sans font-medium text-forest-800 text-sm">{m.full_name}</div>
                      <div className="text-forest-400 text-xs">{m.email}</div>
                      {m.address && <div className="text-forest-400 text-xs">{m.address}</div>}
                      {m.created_at && <div className="text-forest-400 text-xs">Registered {format(new Date(m.created_at), 'MMM d, yyyy')}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleApprove(m.id)} className="btn-gold text-xs py-2 px-5">Approve</button>
                    <button onClick={() => handleReject(m.id)} className="px-4 py-2 text-xs font-sans bg-red-50 text-red-600 hover:bg-red-100 rounded-sm transition-colors">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : tab === 'rejected' ? (
          rejected.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="text-forest-400 mx-auto mb-3" size={32} />
              <p className="text-forest-400 font-body">No rejected members</p>
            </div>
          ) : (
            <div className="card divide-y divide-cream-100">
              {rejected.map((m) => (
                <div key={m.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-full flex items-center justify-center">
                      <XCircle size={16} className="text-red-400" />
                    </div>
                    <div>
                      <div className="font-sans font-medium text-forest-800 text-sm">{m.full_name}</div>
                      <div className="text-forest-400 text-xs">{m.email}</div>
                      {m.address && <div className="text-forest-400 text-xs">{m.address}</div>}
                      {m.created_at && <div className="text-forest-400 text-xs">Registered {format(new Date(m.created_at), 'MMM d, yyyy')}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleApprove(m.id)} className="btn-gold text-xs py-2 px-5">Approve</button>
                    <button onClick={() => handleDelete(m.id, m.full_name)} className="p-2 hover:bg-red-50 rounded-sm transition-colors" title="Delete permanently">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          members.length === 0 ? (
            <div className="card p-8 text-center">
              <Users className="text-forest-300 mx-auto mb-3" size={32} />
              <p className="text-forest-400 font-body">No approved members yet</p>
            </div>
          ) : (
            <div className="card divide-y divide-cream-100">
              {members.map((m) => (
                <div key={m.id} className={`p-5 flex items-center justify-between gap-4 ${m.is_suspended ? 'bg-amber-50' : ''}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 border rounded-full flex items-center justify-center shrink-0 ${m.is_suspended ? 'bg-amber-100 border-amber-300' : 'bg-forest-100 border-forest-200'}`}>
                      <span className={`font-serif font-bold ${m.is_suspended ? 'text-amber-600' : 'text-forest-600'}`}>{m.full_name?.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-sans font-medium text-forest-800 text-sm">{m.full_name}</div>
                      <div className="text-forest-400 text-xs truncate">{m.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-sm font-sans shrink-0 ${ROLE_COLORS[m.role] || 'bg-cream-200 text-forest-600'}`}>
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                    {m.is_suspended && (
                      <span className="text-xs px-2 py-0.5 rounded-sm font-sans shrink-0 bg-amber-100 text-amber-700">
                        Suspended
                      </span>
                    )}
                  </div>
                  {isSuperAdmin && m.id !== user?.id && (
                    <div className="flex items-center gap-2 shrink-0">
                      {!m.is_suspended && (
                        <select
                          value={m.role}
                          onChange={e => handleRoleChange(m.id, e.target.value)}
                          className="input-field text-xs py-1 px-2"
                        >
                          <option value="member">Member</option>
                          <option value="content_admin">Content Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      )}
                      {m.is_suspended ? (
                        <button onClick={() => handleUnsuspend(m.id)} className="p-2 hover:bg-green-50 rounded-sm transition-colors" title="Unsuspend account">
                          <PlayCircle size={14} className="text-green-600" />
                        </button>
                      ) : (
                        <button onClick={() => handleSuspend(m.id, m.full_name)} className="p-2 hover:bg-amber-50 rounded-sm transition-colors" title="Suspend account">
                          <PauseCircle size={14} className="text-amber-500" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(m.id, m.full_name)} className="p-2 hover:bg-red-50 rounded-sm transition-colors" title="Delete permanently">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
