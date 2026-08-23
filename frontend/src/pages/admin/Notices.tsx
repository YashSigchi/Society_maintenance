import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/datetime';

export const AdminNotices = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', important: false });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/notices?page=${page}&pageSize=${pageSize}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotices(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to fetch notices', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [token, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/api/notices/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Notice updated' });
      } else {
        await api.post('/api/notices', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Notice created' });
      }
      setFormData({ title: '', content: '', important: false });
      setEditingId(null);
      fetchNotices();
    } catch (error) {
      toast({ title: 'Failed to save notice', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/api/notices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Notice deleted' });
      // If deleting the last item on a page > 1, go back a page
      if (notices.length === 1 && page > 1) {
        setPage(p => p - 1);
      } else {
        fetchNotices();
      }
    } catch (error) {
      toast({ title: 'Failed to delete notice', variant: 'destructive' });
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">{editingId ? 'Edit Notice' : 'Create New Notice'}</h2>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" required value={formData.title} onChange={(e: any) => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" className="min-h-[150px]" required value={formData.content} onChange={(e: any) => setFormData({...formData, content: e.target.value})} />
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="important" className="rounded text-primary focus:ring-primary h-4 w-4" checked={formData.important} onChange={(e: any) => setFormData({...formData, important: e.target.checked})} />
              <Label htmlFor="important">Mark as Important (High Priority)</Label>
            </div>
            <div className="flex space-x-3 pt-2">
              <Button type="submit" disabled={submitting}>{editingId ? 'Update Notice' : 'Publish Notice'}</Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setFormData({ title: '', content: '', important: false }); }}>Cancel</Button>
              )}
            </div>
          </form>
        </Card>
      </div>

      <div className="space-y-6 flex flex-col">
        <h2 className="text-xl font-bold">Manage Notices</h2>
        
        <div className="space-y-4 flex-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 flex justify-between items-start animate-pulse">
                <div className="space-y-2 w-3/4">
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
              </Card>
            ))
          ) : notices.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No notices yet.</p>
          ) : (
            notices.map(notice => (
              <Card key={notice.id} className={`p-4 flex justify-between items-start ${notice.important ? 'border-l-4 border-l-red-500' : ''}`}>
                <div>
                  <h3 className="font-semibold flex items-center">
                    {notice.title} 
                    {notice.important && <span className="ml-2 w-2 h-2 rounded-full bg-red-500" title="Important"></span>}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notice.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDateTime(notice.createdAt)}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingId(notice.id);
                    setFormData({ title: notice.title, content: notice.content, important: notice.important });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleDelete(notice.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="pt-4 mt-auto border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
