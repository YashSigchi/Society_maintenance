import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, getErrorMessage } from '@/lib/api';
import { cropToSquare } from '@/lib/cropSquare';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const NAME_MAX = 80;
const PASSWORD_MIN = 8;

function passwordIssues(password: string) {
  const issues: string[] = [];
  if (password.length < PASSWORD_MIN) issues.push(`at least ${PASSWORD_MIN} characters`);
  if (!/[A-Z]/.test(password)) issues.push('one uppercase letter');
  if (!/[a-z]/.test(password)) issues.push('one lowercase letter');
  if (!/[0-9]/.test(password)) issues.push('one number');
  return issues;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user, setUser, token } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [preview, setPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const resetFromUser = () => {
    setName(user?.name || '');
    setPreview(user?.avatarUrl || null);
    setAvatarFile(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setUploadProgress(null);
    setFormError('');
  };

  useEffect(() => {
    if (open) resetFromUser();
  }, [open, user?.id]);

  const nameTrimmed = name.trim();
  const nameError =
    nameTrimmed.length === 0
      ? 'Name is required'
      : nameTrimmed.length < 2
        ? 'Name must be at least 2 characters'
        : nameTrimmed.length > NAME_MAX
          ? `Name must be ${NAME_MAX} characters or fewer`
          : '';

  const wantsPassword = Boolean(currentPassword || newPassword || confirmPassword);
  const complexity = passwordIssues(newPassword);
  const passwordError = wantsPassword
    ? !currentPassword
      ? 'Current password is required'
      : complexity.length
        ? `New password needs ${complexity.join(', ')}`
        : newPassword !== confirmPassword
          ? 'New passwords do not match'
          : ''
    : '';

  const nameDirty = nameTrimmed !== (user?.name || '');
  const avatarDirty = Boolean(avatarFile);
  const dirty = nameDirty || avatarDirty || wantsPassword;
  const canSave = dirty && !nameError && !passwordError && !saving;

  const close = (next: boolean) => {
    if (!next && dirty) {
      const discard = window.confirm('Discard unsaved changes?');
      if (!discard) return;
    }
    onOpenChange(next);
  };

  const onPickFile = async (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFormError('Please choose a PNG, JPEG, or WEBP image.');
      return;
    }
    try {
      const cropped = await cropToSquare(file);
      setAvatarFile(cropped);
      setPreview(URL.createObjectURL(cropped));
      setFormError('');
    } catch {
      setFormError('Could not process that image. Try another file.');
    }
  };

  const handleSave = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    setFormError('');
    try {
      let nextUser = user;

      if (avatarDirty && avatarFile) {
        const form = new FormData();
        form.append('avatar', avatarFile);
        const response = await api.post('/api/auth/avatar', form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          },
        });
        nextUser = response.data.user;
        setUploadProgress(100);
      }

      if (nameDirty) {
        const response = await api.patch(
          '/api/auth/profile',
          { name: nameTrimmed },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        nextUser = { ...nextUser, ...response.data.user };
      }

      if (wantsPassword) {
        const response = await api.post(
          '/api/auth/change-password',
          { currentPassword, newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        nextUser = { ...nextUser, ...response.data.user };
        toast({ title: 'Password updated' });
      }

      setUser(nextUser);
      if (avatarDirty) toast({ title: 'Photo updated' });
      if (nameDirty) toast({ title: 'Profile saved' });
      onOpenChange(false);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Could not save profile'));
      toast({ title: 'Could not save profile', description: getErrorMessage(err, 'Please try again'), variant: 'destructive' });
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
          <DialogTitle className="text-xl">Profile settings</DialogTitle>
          <DialogDescription>Update your photo, display name, or password.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
          <section className="flex items-center gap-4">
            <UserAvatar name={nameTrimmed || user.name} src={preview} size="lg" />
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Change photo
              </Button>
              {uploadProgress != null && (
                <p className="text-xs text-muted-foreground">
                  {uploadProgress < 100 ? `Uploading ${uploadProgress}%` : 'Photo saved'}
                </p>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPEG, or WEBP. Cropped to a square.</p>
            </div>
          </section>

          <section className="space-y-1.5">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError ? (
              <p className="text-xs text-destructive">{nameError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{nameTrimmed.length}/{NAME_MAX}</p>
            )}
          </section>

          <section className="space-y-1.5">
            <Label>Role</Label>
            <Input value={user.role} readOnly disabled className="bg-muted" />
          </section>

          <section className="space-y-3 pt-2 border-t">
            <h3 className="text-sm font-semibold">Change password</h3>
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              error={wantsPassword && complexity.length ? passwordError.includes('New password') ? passwordError : undefined : undefined}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              error={wantsPassword && newPassword && newPassword !== confirmPassword ? 'New passwords do not match' : undefined}
            />
          </section>

          {formError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{formError}</div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-white dark:bg-gray-900">
          <Button type="button" variant="outline" onClick={() => close(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
