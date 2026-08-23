import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PhotoUploader, type PreviewFile } from '@/components/complaints/PhotoUploader';

export const RaiseComplaint = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [formData, setFormData] = useState({ category: 'Plumbing', description: '', location: '' });
  const [photos, setPhotos] = useState<PreviewFile[]>([]);

  const categories = [
    'Plumbing', 'Electrical', 'Cleaning', 'Security',
    'Elevator', 'Water Supply', 'Parking', 'Common Area', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress(0);
    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('description', formData.description);
      if (formData.location) data.append('location', formData.location);
      photos.forEach((p) => data.append('photos', p.file));

      const response = await api.post('/api/complaints', data, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setComplaintId(response.data.complaintNumber);
      setSuccess(true);
      toast({ title: 'Complaint submitted successfully', description: `Your complaint ID is ${response.data.complaintNumber}` });
    } catch {
      toast({ title: 'Failed to submit complaint', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20">
        <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
        <h2 className="text-3xl font-bold mb-2">Complaint submitted</h2>
        <p className="text-muted-foreground text-lg mb-8">Assigned reference <span className="font-semibold text-primary">{complaintId}</span>.</p>
        <div className="space-x-4">
          <Button onClick={() => navigate('/resident/complaints')}>View My Complaints</Button>
          <Button variant="outline" onClick={() => { setSuccess(false); setPhotos([]); setFormData({ category: 'Plumbing', description: '', location: '' }); }}>Raise Another</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Raise a Maintenance Complaint</h1>
        <p className="text-muted-foreground mt-1">Tell us what's wrong and we'll help get it resolved.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input id="location" placeholder="e.g. Block A lobby, Kitchen sink" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in as much detail as possible..."
              className="min-h-[150px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground text-right">{formData.description.length} characters</p>
          </div>

          <div className="space-y-2">
            <Label>Photos (optional, up to 10)</Label>
            <PhotoUploader files={photos} onChange={setPhotos} />
          </div>

          {loading && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-right">Uploading {progress}%</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
