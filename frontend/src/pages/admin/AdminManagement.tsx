import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, getErrorMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
}

export const AdminManagement = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(response.data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to load administrators'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await api.post(
        '/api/admin/users',
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Admin created', description: `${formData.email} can now sign in.` });
      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      await fetchAdmins();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to create admin account'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div>Loading administrators...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
        <p className="text-muted-foreground mt-1">
          Create additional administrator accounts. Only authenticated admins can perform this action.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Create admin</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required minLength={2} value={formData.name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={formData.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={formData.password} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" required minLength={6} value={formData.confirmPassword} onChange={handleChange} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-lg mb-4">Administrators</h2>
          <div className="space-y-3">
            {admins.length === 0 && (
              <p className="text-sm text-muted-foreground">No administrators found.</p>
            )}
            {admins.map((admin) => (
              <div key={admin.id} className="border rounded-lg p-3">
                <p className="font-medium">{admin.name}</p>
                <p className="text-sm text-muted-foreground">{admin.email}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
