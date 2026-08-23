import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, Label
} from 'recharts';

const COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#8b5cf6', '#06b6d4'];
const STATUS_COLORS = { 'Open': '#2563eb', 'In Progress': '#d97706', 'Resolved': '#16a34a' };

export const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - parseInt(dateRange, 10));
        
        const response = await api.get(`/api/admin/dashboard?from=${from.toISOString()}&to=${to.toISOString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, dateRange]);

  if (loading || !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>)}
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Format trends data for LineChart
  const formattedTrends = data.trends.map((t: any) => {
    const d = new Date(t.date);
    return { ...t, displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's the society overview.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-1 shadow-sm">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
          <select 
            className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer pl-1 pr-8 py-1"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Complaints" value={data.summary.total} icon={<FileText className="w-5 h-5 text-gray-500" />} />
        <StatCard title="Open (Action Req.)" value={data.summary.open} icon={<AlertTriangle className="w-5 h-5 text-blue-500" />} />
        <StatCard title="In Progress" value={data.summary.inProgress} icon={<Clock className="w-5 h-5 text-amber-500" />} />
        <StatCard title="Resolved" value={data.summary.resolved} icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} />
        <Card className="p-6 flex flex-col justify-between h-32 hover:shadow-md transition-shadow bg-primary/5 border-primary/20">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-primary/80">Avg. Resolution</h3>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline space-x-1">
            <p className="text-3xl font-bold text-primary">{data.summary.avgResolutionHours}</p>
            <span className="text-sm font-medium text-primary/70">hrs</span>
          </div>
        </Card>
      </div>

      {data.summary.overdue > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 mr-3 shrink-0" />
            <div>
              <p className="font-semibold text-lg">{data.summary.overdue} Overdue Complaints</p>
              <p className="text-sm mt-0.5 opacity-90">Complaints older than the SLA threshold need immediate attention.</p>
            </div>
          </div>
          <Link to="/admin/complaints?filter=overdue">
            <Button variant="destructive" size="sm">Review Now</Button>
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Trend Line Chart */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6 text-lg">Complaint Volume Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Complaints" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution Donut */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6 text-lg">Status Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} />
                  ))}
                  <Label 
                    value={data.summary.total} 
                    position="center" 
                    className="text-3xl font-bold fill-gray-900 dark:fill-gray-100" 
                  />
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, 'Complaints']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Analysis Horizontal Bar */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6 text-lg">Category Breakdown</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categories.slice(0, 7)} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151' }} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" name="Complaints" radius={[0, 4, 4, 0]} barSize={24}>
                  {data.categories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Stacked Bar */}
        <Card className="p-6">
          <h3 className="font-semibold mb-6 text-lg">Priority by Status</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.priorityBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="HIGH" stackId="a" fill="#dc2626" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="MEDIUM" stackId="a" fill="#d97706" radius={[0, 0, 0, 0]} />
                <Bar dataKey="LOW" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => {
  const borderColors: Record<string, string> = {
    'Total Complaints': 'border-l-blue-500',
    'Open': 'border-l-red-500',
    'In Progress': 'border-l-orange-500',
    'Resolved': 'border-l-green-500',
  };
  const borderClass = borderColors[title] ? `border-l-4 ${borderColors[title]}` : '';

  return (
    <Card className={`p-6 flex flex-col justify-between h-32 hover:shadow-md transition-shadow ${borderClass}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
};
