import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Search, AlertTriangle, Clock, MessageSquare, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { StatusBadge, PriorityBadge, OverdueBadge } from '@/components/complaints/Badges';
import { formatDateTime } from '@/lib/datetime';
import { ComplaintDetailModal } from '@/components/admin/ComplaintDetailModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

export const AdminComplaints = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [updatingBulk, setUpdatingBulk] = useState(false);

  // Modal
  const [modalComplaintId, setModalComplaintId] = useState<string | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(location.search);
      const isOverdue = queryParams.get('filter') === 'overdue';
      
      let url = isOverdue ? '/api/admin/overdue' : `/api/complaints?page=${page}&pageSize=${pageSize}`;
      
      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (isOverdue) {
        setComplaints(response.data);
        setTotal(response.data.length);
      } else {
        setComplaints(response.data.items);
        setTotal(response.data.total);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Failed to fetch complaints', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [token, location.search, page]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/api/complaints/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(complaints.map(c => c.id === id ? { ...c, status: newStatus, resolvedAt: newStatus === 'RESOLVED' ? new Date() : null } : c));
      toast({ title: 'Status updated successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to update status', description: error.response?.data?.message || 'Error occurred', variant: 'destructive' });
    }
  };

  const handlePriorityUpdate = async (id: string, newPriority: string) => {
    try {
      await api.patch(`/api/complaints/${id}`, { priority: newPriority }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(complaints.map(c => c.id === id ? { ...c, priority: newPriority } : c));
      toast({ title: 'Priority updated successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to update priority', variant: 'destructive' });
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !bulkStatus) return;
    setUpdatingBulk(true);
    try {
      const response = await api.post('/api/complaints/bulk-status', {
        ids: Array.from(selectedIds),
        status: bulkStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({ title: `Successfully updated ${response.data.updated} complaints` });
      setSelectedIds(new Set());
      setBulkStatus('');
      fetchComplaints();
    } catch (error: any) {
      toast({ title: 'Bulk update failed', description: error.response?.data?.message || 'Error occurred', variant: 'destructive' });
    } finally {
      setUpdatingBulk(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const filtered = complaints.filter(c => 
    (statusFilter === 'ALL' || c.status === statusFilter) &&
    (c.complaintNumber.toLowerCase().includes(search.toLowerCase()) || 
     c.description?.toLowerCase().includes(search.toLowerCase()) ||
     c.resident?.name?.toLowerCase().includes(search.toLowerCase()) ||
     c.resident?.apartmentNumber?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Complaints</h1>
          <p className="text-muted-foreground mt-1">Manage and resolve resident issues.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            className="pl-10 h-10" 
            placeholder="Search by ID, resident, or description..." 
            value={search}
            onChange={(e: any) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 text-sm font-medium text-primary">
            <CheckSquare className="w-5 h-5" />
            <span>{selectedIds.size} complaints selected</span>
          </div>
          <div className="flex items-center space-x-3">
            <select
              className="h-9 rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="" disabled>Change status to...</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <Button size="sm" onClick={handleBulkUpdate} disabled={!bulkStatus || updatingBulk}>
              {updatingBulk ? 'Updating...' : 'Apply to Selected'}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left relative">
            <thead className="text-xs text-muted-foreground uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded text-primary focus:ring-primary"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Complaint</th>
                <th className="px-6 py-4 font-semibold">Resident</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Notes</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No complaints found.
                  </td>
                </tr>
              ) : (
                filtered.map(complaint => (
                  <tr 
                    key={complaint.id} 
                    className={`border-b border-gray-100 dark:border-gray-800 transition-colors cursor-pointer ${complaint.isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} ${selectedIds.has(complaint.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                    onClick={() => setModalComplaintId(complaint.id)}
                  >
                    <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="rounded text-primary focus:ring-primary"
                        checked={selectedIds.has(complaint.id)}
                        onChange={() => toggleSelection(complaint.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-primary">{complaint.complaintNumber}</span>
                          {complaint.isOverdue && <OverdueBadge />}
                        </div>
                        <span className="text-muted-foreground mt-1 truncate max-w-[150px]" title={complaint.category}>{complaint.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={complaint.resident?.name} src={complaint.resident?.avatarUrl} size="sm" />
                        <div>
                          <div className="font-medium">{complaint.resident?.name}</div>
                          <div className="text-muted-foreground text-xs">Apt: {complaint.resident?.apartmentNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDateTime(complaint.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={complaint.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={complaint.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {complaint.hasNotes ? (
                        <div className="flex items-center justify-center text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-md" title={`${complaint.notesCount} internal notes`}>
                          <MessageSquare className="w-4 h-4 mr-1.5" />
                          <span className="text-xs font-semibold">{complaint.notesCount}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {complaint.status !== 'RESOLVED' ? (
                        <div className="flex flex-col space-y-2 items-end">
                          <select 
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-28"
                            value={complaint.priority}
                            onChange={(e: any) => handlePriorityUpdate(complaint.id, e.target.value)}
                          >
                            <option value="LOW">Low Priority</option>
                            <option value="MEDIUM">Med Priority</option>
                            <option value="HIGH">High Priority</option>
                          </select>
                          <select 
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-28"
                            value={complaint.status}
                            onChange={(e: any) => handleStatusUpdate(complaint.id, e.target.value)}
                          >
                            <option value="OPEN">Set Open</option>
                            <option value="IN_PROGRESS">Set In Progress</option>
                            <option value="RESOLVED">Set Resolved</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} entries
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

      <ComplaintDetailModal 
        complaintId={modalComplaintId} 
        open={!!modalComplaintId} 
        onOpenChange={(open) => !open && setModalComplaintId(null)}
        onUpdate={fetchComplaints}
      />
    </div>
  );
};
