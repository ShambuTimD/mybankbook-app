import { useForm, Head } from '@inertiajs/react';
import React from 'react';

export default function EditRole({ page, data, permissions }) {
  const { data: formData, setData, put, processing } = useForm({
    id: data.id,
    permission: data.current_permissions || [], // pre-filled permissions
    role_for: data.role_for,
    role_name: data.role_name, // keep role name (read-only)
  });


  const handleCheck = (perm) => {
    const selected = new Set(formData.permission);
    selected.has(perm) ? selected.delete(perm) : selected.add(perm);
    setData('permission', Array.from(selected));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitting Role Data:", formData);

    put(route("role.update", data.id), {
      preserveScroll: true,
      onSuccess: (page) => {
        console.log("✅ Update successful:", page);
      },
      onError: (errors) => {
        console.error("❌ Validation/Server error:", errors);
      },
      onFinish: () => {
        console.log("ℹ️ Request finished");
      },
    });
  };


  const selectAllPermission = () => {
    if (confirm("Are you sure you want to give all permissions?")) {
      const allPerms = Object.values(permissions)
        .flat()
        .filter((p) => p.includes('.'));
      setData('permission', allPerms);
    }
  };

  const toggleGroup = (groupKey) => {
    const groupPerms = permissions[groupKey].filter((p) => p.includes('.'));
    const isSelected = groupPerms.every((p) =>
      formData.permission.includes(p)
    );
    const updated = new Set(formData.permission);
    groupPerms.forEach((p) =>
      isSelected ? updated.delete(p) : updated.add(p)
    );
    setData('permission', Array.from(updated));
  };

  const renamePermission = (perm) => {
    const map = { index: 'List', store: 'Create&Store' };
    const parts = perm.split('.');
    return map[parts[1]] || parts[1];
  };

  return (
    <>
      <Head title={`Edit ${page}`} />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">{page} Edit</h2>
          <a
            href={route('role.list')}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 text-sm"
          >
            ← Back to {page} List
          </a>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role For (read-only dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role For
              </label>
              <select
                value={formData.role_for}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              >
                <option value={formData.role_for}>
                  {formData.role_for.charAt(0).toUpperCase() + formData.role_for.slice(1)}
                </option>
              </select>
            </div>

            {/* Role Name (read-only dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role Name
              </label>
              <select
                value={formData.role_name}
                disabled
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
              >
                <option value={formData.role_name}>{data.role_title}</option>
              </select>
            </div>
          </div>


          {/* Permissions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Role Permissions
            </h3>
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
                <div key={group} className="border rounded p-4 bg-gray-50">
                  <div className="mb-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600"
                        onChange={() => toggleGroup(group)}
                        checked={perms
                          .filter((p) => p.includes('.'))
                          .every((p) => formData.permission.includes(p))}
                      />
                      <span className="ml-2 text-gray-800 font-medium">
                        {group} - All
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {perms.map((perm) =>
                      perm.includes('.') ? (
                        <label
                          key={perm}
                          className="inline-flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox text-blue-600"
                            checked={formData.permission.includes(perm)}
                            onChange={() => handleCheck(perm)}
                          />
                          <span className="text-sm text-gray-700">
                            {renamePermission(perm)}
                          </span>
                        </label>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
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
    </>
  );
}
