import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, FileText, Bell, Settings, LogOut, Shield, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AccessDenied } from '@/pages/shared/AccessDenied';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { cn } from '@/lib/utils';

export const MainLayout = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [profileOpen, setProfileOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  const isAdminPath = location.pathname.startsWith('/admin');
  if (isAdminPath && user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AccessDenied />
      </div>
    );
  }

  if (location.pathname.startsWith('/resident') && user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const residentLinks = [
    { name: 'Dashboard', path: '/resident/dashboard', icon: Home },
    { name: 'My Complaints', path: '/resident/complaints', icon: FileText },
    { name: 'Notice Board', path: '/notices', icon: Bell },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Home },
    { name: 'All Complaints', path: '/admin/complaints', icon: FileText },
    { name: 'Notice Board', path: '/notices', icon: Bell },
    { name: 'Manage Notices', path: '/admin/notices', icon: Settings },
    { name: 'Admin Management', path: '/admin/management', icon: Shield },
  ];

  const links = user.role === 'ADMIN' ? adminLinks : residentLinks;
  const pageName =
    links.find((l) => location.pathname === l.path || location.pathname.startsWith(`${l.path}/`))?.name || 'Dashboard';

  return (
    <div className="h-screen overflow-hidden flex bg-gray-50 dark:bg-gray-900">
      {!collapsed && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={cn(
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 z-40',
          collapsed ? 'w-16 hidden lg:flex' : 'w-64 fixed inset-y-0 left-0 lg:static flex'
        )}
      >
        <div className="h-16 flex items-center px-3 border-b border-gray-200 dark:border-gray-700 justify-between gap-2">
          {!collapsed && <h1 className="text-xl font-bold text-primary px-2 truncate">SocietyHub</h1>}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="flex-1 py-6 px-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive =
              location.pathname === link.path ||
              (link.path !== '/resident/complaints' && location.pathname.startsWith(`${link.path}/`)) ||
              (link.path === '/resident/complaints' && location.pathname.startsWith('/resident/complaints'));
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setCollapsed(true);
                }}
              >
                <div
                  className={cn(
                    'flex items-center rounded-lg cursor-pointer transition-colors border-l-4',
                    collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3',
                    isActive
                      ? 'bg-primary/10 text-primary font-medium border-l-primary'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-transparent'
                  )}
                  title={collapsed ? link.name : undefined}
                >
                  <Icon className={cn('w-5 h-5 shrink-0', collapsed ? '' : 'mr-3')} />
                  {!collapsed && link.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className={cn(
              'w-full flex items-center rounded-lg mb-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left',
              collapsed && 'justify-center'
            )}
            aria-label="Open profile settings"
          >
            <UserAvatar name={user.name} src={user.avatarUrl} size="sm" className={collapsed ? '' : 'mr-3'} />
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </div>
            )}
          </button>
          <Button
            variant="ghost"
            className={cn(
              'w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30',
              collapsed ? 'px-0 justify-center' : 'justify-start'
            )}
            onClick={logout}
            aria-label="Logout"
          >
            <LogOut className={cn('w-5 h-5', collapsed ? '' : 'mr-3')} />
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 sm:px-8 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setCollapsed(false)}
            aria-label="Open navigation"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">{pageName}</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>
      </main>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
};
