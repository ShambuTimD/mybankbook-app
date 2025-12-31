import { useForm, Head } from '@inertiajs/react';
import { useState } from 'react';
import ComponentCard from '@/Components/common/ComponentCard';
import Label from '@/Components/form/Label';
import Input from '@/Components/form/input/InputField';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function CreateUser({ rolesGrouped }) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    type: 'backend', // fixed backend
    role_id: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('user.store'), { preserveScroll: true });
  };

  const currentRoles = rolesGrouped.backend || [];

  return (
    <>
      <Head title="Create User" />
      <ComponentCard
        title="Create New User"
        url={route('user.list')}
        urlText="Back to Users"
        urlIcon={faArrowLeft}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          {/* Name */}
          <div className="md:col-span-2">
            <Label htmlFor="name">Name<span className="text-red-500">*</span></Label>
            <Input
              id="name"
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Full Name"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email<span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              placeholder="Email address"
            />
            {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
          </div>

          {/* User Type (fixed to backend) */}
          <div>
            <Label htmlFor="type">User Type<span className="text-red-500">*</span></Label>
            <select
              id="type"
              value={data.type}
              disabled
              className="form-select w-full rounded bg-gray-100 cursor-not-allowed"
            >
              <option value="backend">Backend</option>
            </select>
            <input type="hidden" name="type" value={data.type} />
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role_id">Role <span className="text-red-500">*</span></Label>
            <select
              id="role_id"
              value={data.role_id}
              onChange={(e) => setData('role_id', e.target.value)}
              className="form-select w-full rounded"
            >
              <option value="">Select Role</option>
              {currentRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_title}
                </option>
              ))}
            </select>
            {errors.role_id && <p className="text-red-500 text-xs">{errors.role_id}</p>}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="password_confirmation">Confirm Password <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showConfirmPassword ? 'text' : 'password'}
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-600"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password_confirmation && <p className="text-red-500 text-xs">{errors.password_confirmation}</p>}
          </div>

          {/* Submit */}
          <div className="col-span-2 text-right mt-4">
            <button
              type="submit"
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
            >
              {processing ? 'Saving...' : 'Create User'}
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
