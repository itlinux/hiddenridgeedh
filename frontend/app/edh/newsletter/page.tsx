'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { newsletterApi } from '@/lib/api';
import { ArrowLeft, Mail, Send, Users, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import RichTextEditor from '@/components/RichTextEditor';

export default function NewsletterPage() {
  const { user, isSuperAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [form, setForm] = useState({ subject: '', content: '' });

  useEffect(() => {
    if (!isLoading && !isSuperAdmin) router.push('/');
  }, [isLoading, isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin) loadSubscribers();
  }, [isSuperAdmin]);

  const loadSubscribers = async () => {
    try {
      const res = await newsletterApi.listSubscribers();
      setSubscribers(res.data.subscribers || res.data || []);
    } catch {
      setSubscribers([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentText = form.content.replace(/<[^>]*>/g, '').trim();
    if (!form.subject.trim() || !contentText) return;
    if (!confirm(`Send newsletter "${form.subject}" to all active subscribers?`)) return;

    setSending(true);
    try {
      const res = await newsletterApi.send({ subject: form.subject, content: form.content });
      const msg = res.data.message || '';
      const match = msg.match(/(\d+)/);
      setSentCount(match ? parseInt(match[1]) : 0);
      setSent(true);
      setForm({ subject: '', content: '' });
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to send newsletter');
    } finally {
      setSending(false);
    }
  };

  if (isLoading || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/edh" className="flex items-center gap-2 text-forest-300 hover:text-gold-400 text-sm mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Mail className="text-gold-400" size={24} />
            <h1 className="font-serif text-2xl text-cream-100">Newsletter</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Subscriber count */}
        <div className="card p-5 flex items-center gap-4">
          <Users className="text-forest-500" size={20} />
          <div>
            <div className="font-sans text-sm text-forest-700">
              {loadingSubs ? 'Loading...' : `${subscribers.filter((s: any) => s.is_active && s.confirmed).length} active / ${subscribers.length} total subscribers`}
            </div>
            <div className="text-forest-400 text-xs font-sans">Subscribers stored in database. Emails sent via {process.env.NEXT_PUBLIC_EMAIL_PROVIDER || 'SMTP/SendGrid'}.</div>
          </div>
        </div>

        {/* Subscriber list */}
        {!loadingSubs && subscribers.length > 0 && (
          <div id="subscribers" className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-cream-200">
              <h3 className="font-serif text-lg text-forest-800">All Subscribers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-100 text-forest-600 font-sans text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {subscribers.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-cream-50">
                      <td className="px-5 py-3 font-body text-forest-700">{sub.email}</td>
                      <td className="px-5 py-3">
                        {sub.is_active && sub.confirmed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-sans bg-green-100 text-green-700">Active</span>
                        ) : sub.confirmed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-sans bg-yellow-100 text-yellow-700">Unsubscribed</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-sans bg-gray-100 text-gray-600">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-forest-400 font-sans text-xs">
                        {sub.subscribed_at ? new Date(sub.subscribed_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete subscriber ${sub.email}?`)) return;
                            try {
                              await newsletterApi.deleteSubscriber(sub.id);
                              setSubscribers(prev => prev.filter((s: any) => s.id !== sub.id));
                            } catch {
                              alert('Failed to delete subscriber');
                            }
                          }}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Delete subscriber"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Send form */}
        {sent ? (
          <div className="card p-8 text-center">
            <Mail className="text-gold-400 mx-auto mb-4" size={48} />
            <h2 className="font-serif text-2xl text-forest-800 mb-2">Newsletter Sent</h2>
            <p className="font-body text-forest-500 mb-6">Successfully sent to {sentCount} subscriber{sentCount !== 1 ? 's' : ''}.</p>
            <button onClick={() => setSent(false)} className="btn-primary text-sm">Send Another</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="card p-8 space-y-6">
            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="input-field w-full"
                placeholder="Hidden Ridge — Weekly Update"
                required
              />
            </div>

            <div>
              <label className="block font-sans text-sm text-forest-700 mb-1">Content</label>
              <RichTextEditor
                value={form.content}
                onChange={(val) => setForm({ ...form, content: val })}
                placeholder="Write your newsletter content here..."
              />
              <p className="text-forest-400 text-xs mt-1 font-sans">Content will be wrapped in the Hidden Ridge email template.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-cream-200">
              <Link href="/edh" className="btn-secondary text-sm px-6 py-2">Cancel</Link>
              <button type="submit" disabled={sending} className="btn-gold text-sm px-6 py-2 flex items-center gap-2">
                <Send size={14} /> {sending ? 'Sending...' : 'Send Newsletter'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
