'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { membersApi, postsApi, eventsApi, newsletterApi } from '@/lib/api';
import { Users, FileText, Calendar, Mail, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Stats {
  pendingMembers: number;
  totalMembers: number;
  totalPosts: number;
  totalEvents: number;
  subscribers: number;
}

export default function AdminDashboard() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/');
  }, [isLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const [membersRes, pendingRes, postsRes, eventsRes] = await Promise.all([
        membersApi.list({ per_page: 1 }),
        membersApi.pending(),
        postsApi.listAdmin({ per_page: 1 }),
        eventsApi.list({ per_page: 1 }),
      ]);
      setStats({
        totalMembers: membersRes.data.total,
        pendingMembers: pendingRes.data.total,
        totalPosts: postsRes.data.total,
        totalEvents: eventsRes.data.total,
        subscribers: 0,
      });
      setPendingUsers(pendingRes.data.items.slice(0, 5));
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const handleApprove = async (userId: string, name: string) => {
    try {
      await membersApi.approve(userId);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      if (stats) setStats({ ...stats, pendingMembers: stats.pendingMembers - 1, totalMembers: stats.totalMembers + 1 });
    } catch (err) {
      console.error('Approval failed', err);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><div className="text-forest-500">Loading...</div></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Admin Header */}
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-3">
          <Shield className="text-gold-400" size={24} />
          <div>
            <h1 className="font-serif text-2xl text-cream-100">Admin Portal</h1>
            <p className="text-forest-300 text-sm font-sans">Hidden Ridge EDH — Neighborhood Management</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Approved Members', value: stats?.totalMembers ?? '—', icon: Users, color: 'text-forest-600' },
            { label: 'Pending Approval', value: stats?.pendingMembers ?? '—', icon: Clock, color: 'text-gold-500', alert: (stats?.pendingMembers ?? 0) > 0 },
            { label: 'Published Posts', value: stats?.totalPosts ?? '—', icon: FileText, color: 'text-forest-600' },
            { label: 'Events', value: stats?.totalEvents ?? '—', icon: Calendar, color: 'text-gold-500' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={stat.color} size={20} />
                {stat.alert && <AlertCircle size={14} className="text-amber-500" />}
              </div>
              <div className="font-serif text-3xl text-forest-800">{stat.value}</div>
              <div className="section-label text-forest-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Approvals */}
          <div className="lg:col-span-2 card">
            <div className="p-6 border-b border-cream-200 flex items-center justify-between">
              <h2 className="font-serif text-xl text-forest-800">Pending Member Approvals</h2>
              <Link href="/edh/members" className="text-gold-500 text-sm font-sans hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-cream-100">
              {pendingUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="text-forest-400 mx-auto mb-3" size={32} />
                  <p className="text-forest-400 font-body text-sm">No pending approvals</p>
                </div>
              ) : pendingUsers.map((user) => (
                <div key={user.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-forest-100 border border-forest-200 rounded-full flex items-center justify-center">
                      <span className="text-forest-600 font-serif font-bold">{user.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-sans font-medium text-forest-800 text-sm">{user.full_name}</div>
                      <div className="text-forest-400 text-xs">{user.email}</div>
                      {user.address && <div className="text-forest-400 text-xs">{user.address}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApprove(user.id, user.full_name)}
                    className="btn-primary text-xs py-2 px-4 whitespace-nowrap"
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="font-serif text-xl text-forest-800 mb-5">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { href: '/edh/posts/new', label: 'New Blog Post', icon: FileText },
                { href: '/edh/events/new', label: 'Create Event', icon: Calendar },
                { href: '/edh/newsletter', label: 'Send Newsletter', icon: Mail },
                { href: '/edh/members', label: 'Manage Members', icon: Users },
                { href: '/edh/gallery', label: 'Manage Gallery', icon: Shield },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-sm hover:bg-cream-50 transition-colors border border-transparent hover:border-cream-200"
                >
                  <action.icon size={16} className="text-gold-500" />
                  <span className="font-sans text-sm text-forest-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
