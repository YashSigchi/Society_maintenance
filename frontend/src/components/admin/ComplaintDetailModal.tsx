import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../complaints/Badges';
import { formatDateTime } from '@/lib/datetime';
import { PhotoGallery } from '../complaints/PhotoGallery';
import { StatusTimeline } from '../complaints/StatusTimeline';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, FileText, Clock, MapPin, StickyNote, History } from 'lucide-react';
import { ScrollRegion } from '../ui/ScrollRegion';
import { EmptyState } from '../ui/EmptyState';
import { UserAvatar } from '../ui/UserAvatar';

export function ComplaintDetailModal({
  complaintId,
  open,
  onOpenChange,
  onUpdate,
}: {
  complaintId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (open && complaintId) {
      fetchComplaint();
    } else {
      setComplaint(null);
      setNoteContent('');
    }
  }, [open, complaintId]);

  const fetchComplaint = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaint(response.data);
    } catch {
      toast({ title: 'Failed to load complaint', variant: 'destructive' });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    try {
      await api.post(
        `/api/complaints/${complaintId}/notes`,
        { content: noteContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Note added successfully' });
      setNoteContent('');
      fetchComplaint();
      onUpdate();
    } catch {
      toast({ title: 'Failed to add note', variant: 'destructive' });
    } finally {
      setSubmittingNote(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-gray-50 dark:bg-gray-900 border-none">
        {loading || !complaint ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="animate-pulse space-y-4 w-full max-w-md">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b shrink-0 sticky top-0 z-20">
              <DialogHeader>
                <div className="pr-8">
                  <DialogTitle className="text-2xl font-bold flex flex-wrap items-center gap-3">
                    {complaint.complaintNumber}
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                    {complaint.isOverdue && <OverdueBadge />}
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-base text-gray-800 dark:text-gray-200">
                    {complaint.category}
                  </DialogDescription>
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-4">
                    <span className="flex items-center gap-2">
                      <UserAvatar name={complaint.resident?.name} src={complaint.resident?.avatarUrl} size="sm" />
                      {complaint.resident?.name} (Apt: {complaint.resident?.apartmentNumber})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Created {formatDateTime(complaint.createdAt)}
                    </span>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
              <div className="lg:col-span-2 min-h-0 max-h-[42vh] lg:max-h-none flex flex-col">
                <ScrollRegion fadeFrom="from-gray-50 dark:from-gray-900">
                  <div className="space-y-4 pr-1 pb-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-3">Description</h3>
                      <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{complaint.description}</p>
                      {complaint.location && (
                        <div className="mt-4 flex items-start text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                          <span>{complaint.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">Photos</h3>
                      <PhotoGallery images={complaint.attachments || []} />
                    </div>
                  </div>
                </ScrollRegion>
              </div>

              <div className="min-h-0 max-h-[42vh] lg:max-h-none flex flex-col gap-4 overflow-hidden">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-0 flex-1 overflow-hidden">
                  <h3 className="text-lg font-semibold mb-4 shrink-0">Status History</h3>
                  <ScrollRegion fadeFrom="from-white dark:from-gray-800">
                    {!complaint.history?.length ? (
                      <EmptyState
                        icon={<History className="w-5 h-5" />}
                        title="No status history yet"
                        description="Updates appear here as the complaint moves through review."
                      />
                    ) : (
                      <StatusTimeline history={complaint.history} />
                    )}
                  </ScrollRegion>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-5 shadow-sm border border-amber-200 dark:border-amber-900 flex flex-col min-h-0 flex-1 overflow-hidden">
                  <h3 className="font-semibold text-lg text-amber-900 dark:text-amber-500 mb-4 flex items-center shrink-0">
                    <FileText className="w-5 h-5 mr-2" /> Internal Admin Notes
                  </h3>
                  <ScrollRegion fadeFrom="from-amber-50 dark:from-amber-950">
                    {!complaint.notes?.length ? (
                      <EmptyState
                        icon={<StickyNote className="w-5 h-5" />}
                        title="No internal notes yet"
                        description="Add a note below. Only admins can see these."
                      />
                    ) : (
                      <div className="space-y-3 pb-2">
                        {complaint.notes.map((note: any) => (
                          <div key={note.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 text-sm shadow-sm border border-amber-100 dark:border-amber-900/50">
                            <div className="flex justify-between items-start mb-1.5 gap-2">
                              <span className="font-medium text-amber-900 dark:text-amber-400">{note.author?.name}</span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(note.createdAt)}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollRegion>
                  <div className="mt-3 shrink-0 relative">
                    <Textarea
                      placeholder="Add an internal note..."
                      className="resize-none pr-12 bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500 min-h-[80px]"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      aria-label="Add an internal note"
                    />
                    <Button
                      size="icon"
                      className="absolute right-2 bottom-2 h-8 w-8 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={handleAddNote}
                      disabled={submittingNote || !noteContent.trim()}
                      aria-label="Send note"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
