'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { safetyLinksApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Shield, Plus, Pencil, Trash2, Loader2, Save, X, ExternalLink, ArrowLeft, Sprout,
} from 'lucide-react';
import Link from 'next/link';

interface SafetyLink {
  id: string;
  label: string;
  url: string;
  sort_order: number;
}

export default function AdminSafetyLinksPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState<SafetyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formOrder, setFormOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/');
  }, [isLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchLinks();
  }, [isAdmin]);

  const fetchLinks = async () => {
    try {
      const res = await safetyLinksApi.list();
      setLinks(res.data.links);
    } catch {
      toast.error('Failed to load links.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormLabel('');
    setFormUrl('');
    setFormOrder(links.length);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (link: SafetyLink) => {
    setFormLabel(link.label);
    setFormUrl(link.url);
    setFormOrder(link.sort_order);
    setEditingId(link.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formUrl.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await safetyLinksApi.update(editingId, {
          label: formLabel.trim(),
          url: formUrl.trim(),
          sort_order: formOrder,
        });
        toast.success('Link updated!');
      } else {
        await safetyLinksApi.create({
          label: formLabel.trim(),
          url: formUrl.trim(),
          sort_order: formOrder,
        });
        toast.success('Link added!');
      }
      resetForm();
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save link.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this link?')) return;
    try {
      await safetyLinksApi.delete(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
      toast.success('Link deleted.');
    } catch {
      toast.error('Failed to delete link.');
    }
  };

  const handleSeed = async () => {
    if (!confirm('Seed 14 default safety links? This only works if the list is empty.')) return;
    setSeeding(true);
    try {
      const res = await safetyLinksApi.seed();
      toast.success(res.data.message);
      fetchLinks();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to seed links.');
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-cream-50 flex items-center justify-center"><div className="text-forest-500">Loading...</div></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-forest-800 border-b border-forest-700">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-3">
          <Shield className="text-gold-400" size={24} />
          <div>
            <h1 className="font-serif text-2xl text-cream-100">Manage Safety Links</h1>
            <p className="text-forest-300 text-sm font-sans">Add, edit, or remove useful links on the Safety page</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin" className="flex items-center gap-2 text-forest-500 hover:text-gold-500 text-sm font-sans transition-colors">
            <ArrowLeft size={14} /> Back to Admin
          </Link>
          <div className="flex items-center gap-3">
            {links.length === 0 && !loading && (
              <button onClick={handleSeed} disabled={seeding} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1">
                {seeding ? <><Loader2 size={14} className="animate-spin" /> Seeding...</> : <><Sprout size={14} /> Seed Defaults</>}
              </button>
            )}
            <button
              onClick={() => { resetForm(); setFormOrder(links.length); setShowForm(!showForm); }}
              className="btn-gold text-xs px-4 py-2 flex items-center gap-1"
            >
              {showForm && !editingId ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Add Link</>}
            </button>
          </div>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
            <h3 className="font-serif text-lg text-forest-800">{editingId ? 'Edit Link' : 'New Link'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="section-label block mb-1 text-xs">Label</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="input-field text-sm"
                  placeholder="e.g. El Dorado County Sheriff"
                  required
                />
              </div>
              <div>
                <label className="section-label block mb-1 text-xs">URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://..."
                  required
                />
              </div>
            </div>
            <div className="w-32">
              <label className="section-label block mb-1 text-xs">Sort Order</label>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                className="input-field text-sm"
                min={0}
              />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={submitting} className="btn-primary text-sm flex items-center gap-2">
                {submitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> {editingId ? 'Update' : 'Add'} Link</>}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-secondary text-sm">Cancel</button>
              )}
            </div>
          </form>
        )}

        {/* Links Table */}
        {loading ? (
          <div className="card p-12 flex justify-center">
            <Loader2 className="animate-spin text-forest-400" size={28} />
          </div>
        ) : links.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-forest-400 font-sans text-sm mb-3">No safety links yet.</p>
            <p className="text-forest-300 font-sans text-xs">Click &quot;Seed Defaults&quot; to add the standard 14 links, or add them manually.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream-100 border-b border-cream-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-sans text-xs uppercase tracking-wider text-forest-500">#</th>
                    <th className="text-left px-5 py-3 font-sans text-xs uppercase tracking-wider text-forest-500">Label</th>
                    <th className="text-left px-5 py-3 font-sans text-xs uppercase tracking-wider text-forest-500">URL</th>
                    <th className="text-right px-5 py-3 font-sans text-xs uppercase tracking-wider text-forest-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {links.map((link) => (
                    <tr key={link.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-5 py-3 text-forest-400 font-sans text-xs">{link.sort_order}</td>
                      <td className="px-5 py-3 text-forest-800 font-sans text-sm font-medium">{link.label}</td>
                      <td className="px-5 py-3">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-forest-500 hover:text-gold-500 font-sans text-xs flex items-center gap-1 max-w-xs truncate">
                          {link.url} <ExternalLink size={10} />
                        </a>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(link)} className="text-forest-400 hover:text-gold-500 transition-colors" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(link.id)} className="text-forest-400 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
