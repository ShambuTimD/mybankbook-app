import React, { useState, useEffect } from 'react';
import { usePage, router, Head } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope, faPhone, faUser, faMapMarkerAlt, faLock, faEdit, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, flash } = usePage().props;
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    admin_name: '',
    admin_email: '',
    phone: '',
    address_1: '',
    state: '',
    district: '',
    pin: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (flash?.update) {
      toast.success(flash.update);
    }
  }, [flash]);

  useEffect(() => {
    if (showEditModal && user?.id) {
      axios.get(route('admin.profile.edit', user.id)).then(res => {
        const { admin, adminusers } = res.data;
        setForm({
          admin_name: admin.name,
          admin_email: admin.email,
          phone: admin.phone,
          address_1: adminusers?.address_1 || '',
          state: adminusers?.state || '',
          district: adminusers?.district || '',
          pin: adminusers?.postal_code || '',
          password: ''
        });
      }).catch(() => {
        toast.error("Failed to load profile");
      });
    }
  }, [showEditModal, user]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(route('admin.profile.update', user.id), form, {
      onSuccess: () => {
        toast.success('Profile updated successfully');
        setShowEditModal(false);
      },
      onError: () => {
        toast.error('Update failed');
      }
    });
  };

  return (
    <>
      <Head title="Profile" />
      <div className="page-content bg-[#edf3fb] min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="relative bg-[#d3bdf0] rounded-t-md">
            <div className="h-36 rounded-t-md"></div>
            <div className="absolute inset-x-0 top-20 text-center">
              <img
                src="/default/user.svg"
                className="h-20 w-20 rounded-full border-4 border-white mx-auto"
                alt="avatar"
              />
              <h2 className="text-lg font-semibold mt-2">{user.name}</h2>
              <p className="text-sm text-gray-600">{user.user_type}</p>

              <button
                onClick={() => setShowEditModal(true)}
                className="absolute top-4 right-4 bg-white text-purple-600 px-3 py-1 rounded-full text-sm shadow hover:bg-purple-100"
              >
                <FontAwesomeIcon icon={faEdit} className="mr-1" />
                Edit
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-white mt-24 p-6 rounded-b-md shadow">
            <h3 className="text-purple-700 font-bold mb-4 bg-purple-100 inline-block px-3 py-1 rounded-full">
              Portfolio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10 text-sm text-gray-700 mt-2">
              <ProfileRow label="Name" value={user.name} icon={faUser} />
              <ProfileRow label="Email" value={user.email} icon={faEnvelope} />
              <ProfileRow label="User Type" value={user.type} icon={faUser} />
              <ProfileRow label="Address" value={user.address?.address_1 || 'null'} icon={faMapMarkerAlt} />
              <ProfileRow label="State" value={user.address?.state || 'null'} icon={faMapMarkerAlt} />
              <ProfileRow label="District" value={user.address?.district || 'null'} icon={faMapMarkerAlt} />
              <ProfileRow label="PIN" value={user.address?.postal_code || 'null'} icon={faMapMarkerAlt} />
              <ProfileRow label="Password" value="••••••••••••" icon={faLock} />
            </div>
          </div>
        </div>

        {/* Inline Modal (Not separate file) */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white w-[90%] md:w-[700px] rounded-lg shadow-lg p-6 relative">
              <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-3 right-4 text-gray-400 hover:text-red-500 text-xl"
              >
                ×
              </button>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name" name="admin_name" value={form.admin_name} onChange={handleChange} required />
                <Input label="Email" name="admin_email" value={form.admin_email} readOnly />
                <Input label="Address" name="address_1" value={form.address_1} onChange={handleChange} />
                <Input label="State" name="state" value={form.state} onChange={handleChange} />
                <Input label="District" name="district" value={form.district} onChange={handleChange} />
                <Input label="PIN" name="pin" value={form.pin} onChange={handleChange} />
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="form-control w-full border rounded px-3 py-2 pr-10"
                      placeholder="Enter Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </div>
                </div>

                <div className="col-span-2 text-center mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const ProfileRow = ({ label, value, icon }) => (
  <div className="flex items-center border-b pb-2">
    <FontAwesomeIcon icon={icon} className="text-purple-500 w-4 h-4 mr-2" />
    <div className="flex flex-col">
      <span className="text-[13px] text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  </div>
);

const Input = ({ label, ...rest }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input className="form-control w-full border rounded px-3 py-2" {...rest} />
  </div>
);

export default Profile;
