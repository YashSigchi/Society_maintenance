import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { api, unwrapList } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/complaints/Badges';
import { Search } from 'lucide-react';
import { formatDateTime } from '@/lib/datetime';

export const Complaints = () => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/api/complaints?pageSize=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(unwrapList(response.data));
      } catch (error) {
        console.error(error);
      }
    };
    fetchComplaints();
  }, [token]);

  const filtered = complaints.filter(c => 
    c.complaintNumber.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Complaints</h1>
          <p className="text-muted-foreground mt-1">Track the status of all your maintenance requests.</p>
        </div>
        <Link to="/resident/complaints/new">
          <Button>+ Raise New Complaint</Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input 
          className="pl-10 h-12 text-md" 
          placeholder="Search by ID, category or description..." 
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filtered.map(complaint => (
          <Link key={complaint.id} to={`/resident/complaints/${complaint.id}`}>
            <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center space-x-3 mb-1 flex-wrap">
                  <span className="font-semibold text-primary">{complaint.complaintNumber}</span>
                  <StatusBadge status={complaint.status} />
                  <PriorityBadge priority={complaint.priority} />
                </div>
                <h3 className="font-medium text-lg">{complaint.category}</h3>
                <p className="text-muted-foreground line-clamp-1 max-w-2xl mt-1">{complaint.description}</p>
              </div>
              <div className="text-sm text-muted-foreground sm:text-right">
                <p>Created: {formatDateTime(complaint.createdAt)}</p>
                <p>Updated: {formatDateTime(complaint.updatedAt)}</p>
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No complaints match your filters.
          </div>
        )}
      </div>
    </div>
  );
};
