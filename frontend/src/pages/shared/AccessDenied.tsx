import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export const AccessDenied = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
      <h1 className="text-2xl font-bold mb-2">Access denied</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        You do not have permission to view this page. Administrator access is required.
      </p>
      <Link to="/resident/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  );
};
