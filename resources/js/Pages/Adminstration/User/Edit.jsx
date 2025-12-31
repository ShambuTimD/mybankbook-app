import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import ComponentCard from '@/Components/common/ComponentCard';
import Label from '@/Components/form/Label';
import Input from '@/Components/form/input/InputField';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function EditUser({ user, title }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data, setData, put, processing, errors } = useForm({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('user.update', user.id), { preserveScroll: true });
  };

  return (
    <ComponentCard title={"Edit User"} url={route('user.list')} urlText="Back to Users" urlIcon={faArrowLeft}>
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        {/* Name */}
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            placeholder="Full name"
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            placeholder="example@mail.com"
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="password_confirmation">Confirm Password</Label>
          <div className="relative">
            <Input
              id="password_confirmation"
              type={showConfirmPassword ? 'text' : 'password'}
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              placeholder="Confirm password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-600"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password_confirmation && (
            <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>
          )}
        </div>

        {/* Submit */}
        <div className="col-span-2 text-right mt-4">
          <button
            type="submit"
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
          >
            {processing ? 'Saving...' : 'Update User'}
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
