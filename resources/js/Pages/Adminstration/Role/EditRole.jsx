import { useForm } from '@inertiajs/react';
import React from 'react';

export default function EditRole({ page, data, permissions }) {
  const { data: formData, setData, put, processing } = useForm({
    id: data.id,
    permission: data.current_permissions || [], // <-- pre-filled permissions
    name: data.name,
    role_for: data.role_for,
  });

  const handleCheck = (perm) => {
    const selected = new Set(formData.permission);
    selected.has(perm) ? selected.delete(perm) : selected.add(perm);
    setData('permission', Array.from(selected));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('role.update', data.id));
  };

  const selectAllPermission = () => {
    if (confirm("Are you sure you want to give all permissions?")) {
      const allPerms = Object.values(permissions).flat().filter(p => p.includes('.'));
      setData('permission', allPerms);
    }
  };

  const toggleGroup = (groupKey) => {
    const groupPerms = permissions[groupKey].filter(p => p.includes('.'));
    const isSelected = groupPerms.every(p => formData.permission.includes(p));
    const updated = new Set(formData.permission);
    groupPerms.forEach(p => isSelected ? updated.delete(p) : updated.add(p));
    setData('permission', Array.from(updated));
  };

  const renamePermission = (perm) => {
    const map = { index: 'List', store: 'Create&Store' };
    const parts = perm.split('.');
    return map[parts[1]] || parts[1];
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">{page} Edit</h2>
        <a href={route('role.list')} className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 text-sm">
          ← Back to {page} List
        </a>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role for</label>
            <select
              value={formData.role_for}
              onChange={(e) => setData('role_for', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
              required
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="guest">Guest User</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role Name</label>
            <input
              type="text"
              value={data.name}
              readOnly
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Role Permissions</h3>
          <div className="mb-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600"
                onClick={selectAllPermission}
              />
              <span className="ml-2 text-gray-700">Select All</span>
            </label>
          </div>

          <div className="space-y-6">
            {Object.entries(permissions).map(([group, perms]) => (
              <div key={group}>
                <div className="mb-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      onChange={() => toggleGroup(group)}
                      checked={perms.filter(p => p.includes('.')).every(p => formData.permission.includes(p))}
                    />
                    <span className="ml-2 text-gray-800 font-medium">{group} - All</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-4">
                  {perms.map((perm) =>
                    perm.includes('.') ? (
                      <label key={perm} className="inline-flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="form-checkbox text-blue-600"
                          checked={formData.permission.includes(perm)}
                          onChange={() => handleCheck(perm)}
                        />
                        <span className="text-sm text-gray-700">{renamePermission(perm)}</span>
                      </label>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <a
            href={route('role.list')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={processing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Update {page}
          </button>
        </div>
      </form>
    </div>
  );
}
