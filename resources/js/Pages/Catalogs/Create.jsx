import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import ComponentCard from '@/Components/common/ComponentCard';
import PageBreadcrumb from '@/Components/common/PageBreadCrumb';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function CreateCatalog() {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    description: '',
    image: null,
    status: 'active',
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setData(name, type === 'file' ? files[0] : value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('catalogs.store'));
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Create Catalog" />
      <ComponentCard
        title="Create New Catalog"
        url={route('catalogs.index')}
        urlText="Back to Catalogs"
        icon={faArrowLeft}
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Catalog Name */}
          <div>
            <label className="block mb-1 font-semibold">Catalog Name</label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              className="form-input w-full"
            />
            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-semibold">Description</label>
            <textarea
              name="description"
              value={data.description}
              onChange={handleChange}
              className="form-textarea w-full"
              rows={3}
            ></textarea>
            {errors.description && <span className="text-red-500 text-sm">{errors.description}</span>}
          </div>

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">Image</label>
            <input type="file" name="image" onChange={handleChange} className="form-input" />
            {errors.image && <span className="text-red-500 text-sm">{errors.image}</span>}
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">Status</label>
            <select
              name="status"
              value={data.status}
              onChange={handleChange}
              className="form-select w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && <span className="text-red-500 text-sm">{errors.status}</span>}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition duration-300"
              disabled={processing}
            >
              {processing ? 'Creating...' : 'Create Catalog'}
            </button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}

export default CreateCatalog;
