import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export const AuthLayout = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    if (user.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/resident/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Home
        </Link>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">SocietyHub</h1>
          <p className="text-muted-foreground mt-2">A smarter way to manage your community.</p>
        </div>
        <Card className="p-6 shadow-lg border-none">
          <Outlet />
        </Card>
      </div>
    </div>
  );
};
