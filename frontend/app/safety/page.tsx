'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { alertsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  ShieldAlert, Phone, AlertTriangle, Loader2, MessageSquare,
  Trash2, Plus, X, Send, Smartphone, Lock,
} from 'lucide-react';

interface Alert {
  id: string;
  message: string;
  category: string;
  author_name: string;
  author_id: string;
  source: string;
  created_at: string;
}

export default function SafetyPage() {
  const { user, isLoading } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchAlerts();
    else setAlertsLoading(false);
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const res = await alertsApi.list({ limit: 50 });
      setAlerts(res.data.alerts);
    } catch {
      // silent
    } finally {
      setAlertsLoading(false);
    }
  };

  const handleSubmitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSubmitting(true);
    try {
      await alertsApi.create({ message: newMessage.trim(), category: newCategory });
      toast.success('Alert posted!');
      setNewMessage('');
      setShowNewAlert(false);
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to post alert.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Delete this alert?')) return;
    try {
      await alertsApi.delete(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success('Alert deleted.');
    } catch {
      toast.error('Failed to delete alert.');
    }
  };

  const canDelete = (alert: Alert) =>
    user && (alert.author_id === (user as any).id || ['super_admin', 'content_admin'].includes((user as any).role));

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="section-label text-gold-400 mb-3">Stay Safe</p>
          <h1 className="font-serif text-4xl text-cream-100">Safety & Alerts</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* ── Live Neighborhood Alerts (login required) ──────────── */}
        {isLoading ? (
          <div className="card p-8 mb-8 flex justify-center">
            <Loader2 className="animate-spin text-forest-400" size={24} />
          </div>
        ) : user ? (
          <div className="card p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-gold-500" size={24} />
                <h2 className="font-serif text-2xl text-forest-800">Neighborhood Alerts</h2>
              </div>
              <button
                onClick={() => setShowNewAlert(!showNewAlert)}
                className="btn-gold text-xs px-4 py-2 flex items-center gap-1"
              >
                {showNewAlert ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Post Alert</>}
              </button>
            </div>

            {/* SMS info banner */}
            <div className="bg-cream-100 border border-cream-200 rounded-sm p-4 mb-5">
              <p className="font-sans text-xs text-forest-600 leading-relaxed">
                <Smartphone size={13} className="inline text-gold-500 mr-1" />
                <strong>SMS Alerts:</strong> Registered members with SMS enabled can text alerts directly
                to the neighborhood number. The message will appear here automatically.
                Enable SMS in your <a href="/profile" className="text-gold-500 hover:underline">profile settings</a>.
              </p>
            </div>

            {/* New alert form */}
            {showNewAlert && (
              <form onSubmit={handleSubmitAlert} className="bg-cream-100 rounded-sm p-5 mb-5 space-y-3">
                <div>
                  <label className="section-label block mb-1 text-xs">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="general">General</option>
                    <option value="safety">Safety</option>
                    <option value="wildlife">Wildlife</option>
                    <option value="traffic">Traffic</option>
                    <option value="fire">Fire / Smoke</option>
                    <option value="suspicious">Suspicious Activity</option>
                    <option value="utility">Utility / Power</option>
                    <option value="lost-found">Lost & Found</option>
                  </select>
                </div>
                <div>
                  <label className="section-label block mb-1 text-xs">Message</label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="input-field text-sm"
                    rows={3}
                    placeholder="Describe the alert for your neighbors..."
                    maxLength={1000}
                    required
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary text-sm flex items-center gap-2">
                  {submitting ? <><Loader2 size={14} className="animate-spin" /> Posting...</> : <><Send size={14} /> Post Alert</>}
                </button>
              </form>
            )}

            {/* Alert list */}
            {alertsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-forest-400" size={24} />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-forest-400 font-sans text-sm">No alerts yet. Post one to notify your neighbors!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-cream-50 rounded-sm p-4 flex items-start gap-3">
                    <div className="mt-0.5">
                      {alert.source === 'sms' ? (
                        <Smartphone size={16} className="text-gold-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-gold-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-sans text-xs font-semibold text-forest-800">{alert.author_name}</span>
                        <span className="text-forest-300 text-xs">&middot;</span>
                        <span className="text-forest-400 text-xs font-sans">{formatTime(alert.created_at)}</span>
                        {alert.source === 'sms' && (
                          <span className="bg-gold-100 text-gold-700 text-[10px] font-sans uppercase px-1.5 py-0.5 rounded-sm">SMS</span>
                        )}
                        <span className="bg-forest-100 text-forest-600 text-[10px] font-sans uppercase px-1.5 py-0.5 rounded-sm">{alert.category}</span>
                      </div>
                      <p className="font-body text-forest-700 text-sm leading-relaxed">{alert.message}</p>
                    </div>
                    {canDelete(alert) && (
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-forest-300 hover:text-red-500 transition-colors shrink-0 mt-1"
                        title="Delete alert"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="card p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-forest-400" size={24} />
              <h2 className="font-serif text-2xl text-forest-800">Neighborhood Alerts</h2>
            </div>
            <p className="text-forest-500 font-sans text-sm mb-4">
              Live neighborhood alerts are available to registered members.
              Log in to view alerts, post new ones, or text them via SMS.
            </p>
            <a href="/login" className="btn-primary text-sm inline-flex items-center gap-2">
              Log In to View Alerts
            </a>
          </div>
        )}

        {/* ── Emergency Contacts (public) ─────────────────────────── */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="text-gold-500" size={24} />
            <h2 className="font-serif text-2xl text-forest-800">Emergency Contacts</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Emergency (Fire, Police, Medical)', number: '911' },
              { label: 'El Dorado County Sheriff (Non-Emergency)', number: '(530) 621-5655' },
              { label: 'El Dorado Hills Fire Department', number: '(916) 933-6623' },
              { label: 'PG&E Power Outage', number: '1-800-743-5000' },
              { label: 'EID Water Emergency', number: '(530) 642-4000' },
              { label: 'Animal Control', number: '(916) 368-7387' },
            ].map((contact) => (
              <div key={contact.label} className="bg-cream-100 rounded-sm p-4">
                <p className="text-forest-400 text-xs font-sans mb-1">{contact.label}</p>
                <p className="text-forest-800 font-sans font-semibold text-lg">{contact.number}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Safety Tips (public) ────────────────────────────────── */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-gold-500" size={24} />
            <h2 className="font-serif text-2xl text-forest-800">Neighborhood Safety Tips</h2>
          </div>
          <ul className="space-y-4 font-body text-forest-600 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Lock your vehicles</strong> — always lock car doors, even in your own driveway. Never leave valuables visible.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Report suspicious activity</strong> — if you see something unusual, call the El Dorado County Sheriff non-emergency line or 911 if there is an immediate threat.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Wildlife awareness</strong> — coyotes, deer, and rattlesnakes are common in El Dorado Hills. Keep pets supervised and trash secured.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Fire safety</strong> — maintain defensible space around your home. Clear dry brush and dead vegetation, especially during fire season.</span>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-gold-500 mt-0.5 shrink-0" />
              <span><strong>Know your neighbors</strong> — introduce yourself, exchange phone numbers, and watch out for each other. A connected neighborhood is a safer neighborhood.</span>
            </li>
          </ul>
        </div>

        {/* ── Useful Links (public) ───────────────────────────────── */}
        <div className="card p-8">
          <h2 className="font-serif text-2xl text-forest-800 mb-6">Useful Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'El Dorado County Sheriff', url: 'https://www.edcgov.us/Government/Sheriff' },
              { label: 'El Dorado Hills Fire', url: 'https://www.edhfire.com' },
              { label: 'Ready for Wildfire', url: 'https://www.readyforwildfire.org' },
              { label: 'PG&E Outage Map', url: 'https://pgealerts.alerts.pge.com/outagecenter/' },
              { label: 'Nextdoor (EDH)', url: 'https://nextdoor.com' },
              { label: 'El Dorado Hills CSD', url: 'https://www.edhcsd.org' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cream-100 rounded-sm p-3 text-forest-600 font-sans text-sm hover:text-gold-500 hover:bg-cream-200 transition-colors"
              >
                {link.label} &rarr;
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
