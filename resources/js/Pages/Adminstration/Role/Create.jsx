import { Link, useForm, Head} from '@inertiajs/react';
import React from 'react';
import ComponentCard from "@/Components/common/ComponentCard";
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function CreateRole({ title, permissions = [] }) {
  const { data: formData, setData, post, processing } = useForm({
    name: '',
    permission: [],
  });

  const handleCheck = (perm) => {
    const selected = new Set(formData.permission);
    selected.has(perm) ? selected.delete(perm) : selected.add(perm);
    setData('permission', Array.from(selected));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('role.store'));
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
    // const map = { index: 'List', store: 'Create&Store' };
    const parts = perm.split('.');
    return [parts[1]] || parts[1];
  };

  return (
    <>
    <Head title={`Create ${title}`} />
    <ComponentCard title={title + 's List'} url='/adminstration/roles' urlText={'Back to ' + title + ' List'} urlIcon={faArrowLeft}>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          <div>
            <label className="block text-sm font-medium text-gray-700">Role Name</label>
            <input
              type="text"
              value={formData.name}
              placeholder='Enter role name'
              onChange={(e) => setData('name', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700">Role for</label>
            <select
              type="text"
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
              <div key={group} className='border p-4 rounded-lg bg-gray-50'>
                <div className="mb-2">
                  <label className="inline-flex items-center">

                    <span className="mr-2 text-gray-800 font-medium text-xl capitalize">{group} - All</span>
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      onChange={() => toggleGroup(group)}
                      checked={perms.filter(p => p.includes('.')).every(p => formData.permission.includes(p))}
                    />
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
          <Link
            href={route('role.list')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={processing}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Create {title}
          </button>
        </div>
      </form>
    </ComponentCard >
    </>

  );
}
