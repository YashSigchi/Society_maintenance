import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '@/lib/api';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    apartmentNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.name.trim().length < 2) {
      return setError('Full name must be at least 2 characters');
    }

    if (!formData.apartmentNumber.trim()) {
      return setError('Apartment/Flat is required');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        apartmentNumber: formData.apartmentNumber.trim(),
        password: formData.password,
      });
      setSuccess('Account created successfully. Redirecting...');
      login(response.data.token, response.data.user);
      navigate('/resident/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Create an account</h2>
        <p className="text-muted-foreground text-sm mt-1">Join SocietyHub as a resident</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md">
            {success}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" required minLength={2} value={formData.name} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="name@example.com" required value={formData.email} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apartmentNumber">Apartment/Flat</Label>
            <Input id="apartmentNumber" required value={formData.apartmentNumber} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} value={formData.password} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" required minLength={6} value={formData.confirmPassword} onChange={handleChange} />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign In
        </Link>
      </div>
    </div>
  );
};
