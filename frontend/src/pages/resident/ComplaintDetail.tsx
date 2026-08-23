import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { formatDateTime } from '@/lib/datetime';
import { StatusBadge, PriorityBadge, OverdueBadge } from '@/components/complaints/Badges';
import { PhotoGallery } from '@/components/complaints/PhotoGallery';
import { StatusTimeline } from '@/components/complaints/StatusTimeline';

export const ComplaintDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [complaint, setComplaint] = useState<any>(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const response = await api.get(`/api/complaints/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setComplaint(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchComplaint();
  }, [id, token]);

  if (!complaint) {
    return <div className="p-8 space-y-4"><div className="h-8 w-64 bg-gray-100 rounded animate-pulse" /><div className="h-48 bg-gray-100 rounded animate-pulse" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/resident/complaints">
          <Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{complaint.category}</h1>
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isOverdue && <OverdueBadge />}
          </div>
          <p className="text-muted-foreground mt-1">{complaint.complaintNumber} · Submitted {formatDateTime(complaint.createdAt)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{complaint.description}</p>
            </div>
            {complaint.location && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="mt-1">{complaint.location}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDateTime(complaint.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last updated</p>
                <p className="font-medium">{formatDateTime(complaint.updatedAt)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Photo gallery</h3>
            <PhotoGallery images={complaint.attachments || []} />
          </Card>
        </div>
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-lg">Status timeline</h3>
          <StatusTimeline history={complaint.history || []} />
        </Card>
      </div>
    </div>
  );
};
