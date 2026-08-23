import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, unwrapList } from '@/lib/api';
import { formatDateTime } from '@/lib/datetime';
import { StatusBadge } from '@/components/complaints/Badges';

export const ResidentDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await api.get('/api/complaints', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const complaints = unwrapList(response.data);
        setStats({
          total: complaints.length,
          open: complaints.filter((c: any) => c.status === 'OPEN').length,
          inProgress: complaints.filter((c: any) => c.status === 'IN_PROGRESS').length,
          resolved: complaints.filter((c: any) => c.status === 'RESOLVED').length,
        });
        setRecent(complaints.slice(0, 5));
      } catch (error) {
        console.error(error);
      }
    };
    fetchComplaints();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Good morning, {user?.name.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground">Here's what's happening with your maintenance requests.</p>
        </div>
        <Link to="/resident/complaints/new">
          <Button className="font-semibold">+ Raise New Complaint</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Complaints" value={stats.total} icon={<FileText className="w-5 h-5 text-gray-500" />} />
        <StatCard title="Open" value={stats.open} icon={<AlertCircle className="w-5 h-5 text-blue-500" />} />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Clock className="w-5 h-5 text-amber-500" />} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Complaints</h3>
        {recent.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Everything looks clear!</h4>
            <p className="text-muted-foreground mt-2 mb-4">You haven't raised any maintenance complaints yet.</p>
            <Link to="/resident/complaints/new">
              <Button>Raise a Complaint</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {recent.map((complaint, i) => (
              <motion.div key={complaint.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link to={`/resident/complaints/${complaint.id}`}>
                  <Card className="p-4 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary">
                    <div>
                      <p className="font-semibold text-primary">{complaint.complaintNumber}</p>
                      <p className="text-sm font-medium">{complaint.category}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-lg">{complaint.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={complaint.status} />
                      <span className="text-xs text-muted-foreground">{formatDateTime(complaint.createdAt)}</span>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
  <Card className="p-6 flex flex-col justify-between h-32 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {icon}
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </Card>
);

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'IN_PROGRESS': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'RESOLVED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-700';
  }
};
