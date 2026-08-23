import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { api, getErrorMessage } from '@/lib/api';

export const ChangePassword = () => {
  const { user, token, setUser, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('New password must be at least 6 characters');
    }

    if (newPassword !== confirmPassword) {
      return setError('New passwords do not match');
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/api/auth/change-password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data.user);
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/resident/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">SocietyHub</h1>
          <p className="text-muted-foreground mt-2">Update your password to continue.</p>
        </div>
        <Card className="p-6 shadow-lg border-none">
          <h2 className="text-2xl font-semibold mb-2">Change password</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {user.mustChangePassword
              ? 'Your account requires a new password before you can use the dashboard.'
              : 'Choose a new password for your account.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating...' : 'Update password'}
            </Button>
          </form>

          <Button variant="ghost" className="w-full mt-4" onClick={logout}>
            Sign out
          </Button>
          <div className="mt-2 text-center">
            <Link to="/" className="text-sm text-primary hover:underline">Back to Home</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
