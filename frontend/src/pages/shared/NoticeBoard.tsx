import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Bell, AlertCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDateTime } from '@/lib/datetime';

export const NoticeBoard = () => {
  const { token } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/notices?page=${page}&pageSize=${pageSize}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotices(response.data.items);
        setTotal(response.data.total);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, [token, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex flex-col min-h-[80vh]">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-muted-foreground mt-1">Important announcements and community updates.</p>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-6 border-l-4 border-l-gray-200 dark:border-l-gray-800 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-32"></div>
              </div>
            </Card>
          ))
        ) : notices.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-white dark:bg-gray-900 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
            <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All caught up!</h3>
            <p className="mt-1">No notices have been published yet.</p>
          </div>
        ) : (
          notices.map((notice, i) => (
            <motion.div key={notice.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`p-6 border-l-4 ${notice.important ? 'border-l-red-500' : 'border-l-primary'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold">{notice.title}</h2>
                    {notice.important && (
                      <span className="flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <AlertCircle className="w-3 h-3 mr-1" /> Important
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground shrink-0 ml-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDateTime(notice.createdAt)}
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                  <p className="whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm text-muted-foreground flex justify-between">
                  <span>Posted by {notice.author?.name || 'Admin'}</span>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between mt-auto">
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} notices
          </span>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === totalPages}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
