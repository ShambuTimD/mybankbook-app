// resources/js/Pages/Offices/Edit.jsx
import React from "react";
import { useForm, Head } from "@inertiajs/react";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";

export default function EditOffice({ office, companies }) {
  const {
    data,
    setData,
    put,
    processing,
    errors,
    setError,
    clearErrors,
  } = useForm({
    company_id: office?.company_id ?? "",
    office_name: office?.office_name ?? "",
    address_line_1: office?.address_line_1 ?? "",
    address_line_2: office?.address_line_2 ?? "",
    city: office?.city ?? "",
    state: office?.state ?? "",
    country: office?.country ?? "",
    pincode: office?.pincode ?? "",
    status: office?.status ?? "active",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(name, value);
    // clear the inline error for the field once user edits it
    if (errors[name]) clearErrors(name);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Map of required keys -> human labels
    const required = {
      company_id: "Company",
      office_name: "Office Name",
      address_line_1: "Address Line 1",
      status: "Status",
    };

    // Find missing fields
    const missing = Object.entries(required)
      .filter(([k]) => !data[k] || data[k].toString().trim() === "")
      .map(([k, label]) => ({ key: k, label }));

    // Show alert + set inline errors if any required field is missing
    if (missing.length) {
      // set inline errors
      missing.forEach(({ key, label }) =>
        setError(key, `${label} is required.`)
      );
      // alert list
      alert(
        "Please fill the following fields:\n" +
          missing.map((m) => m.label).join("\n")
      );
      return;
    }

    // Submit with PUT to companyOffice.update
    put(route("companyOffice.update", office.id), {
      preserveScroll: true,
    });
  };

  return (
    <>
      <Head title="Edit Company Office" />
      <PageBreadcrumb pageTitle="Edit Company Office" />
      <ComponentCard title="Edit Office">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Company */}
          <div>
            <label className="block font-semibold mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <select
              name="company_id"
              value={data.company_id}
              onChange={handleChange}
              className={`form-select w-full ${
                errors.company_id ? "border-red-500" : ""
              }`}
            >
              <option value="">-- Select Company --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.company_id && (
              <p className="text-sm text-red-500 mt-1">{errors.company_id}</p>
            )}
          </div>

          {/* Office Name */}
          <div>
            <label className="block font-semibold mb-1">
              Office Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="office_name"
              value={data.office_name}
              onChange={handleChange}
              className={`form-input w-full ${
                errors.office_name ? "border-red-500" : ""
              }`}
              placeholder="e.g., Head Office"
            />
            {errors.office_name && (
              <p className="text-sm text-red-500 mt-1">
                {errors.office_name}
              </p>
            )}
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block font-semibold mb-1">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address_line_1"
              value={data.address_line_1}
              onChange={handleChange}
              className={`form-input w-full ${
                errors.address_line_1 ? "border-red-500" : ""
              }`}
              placeholder="Street, Area"
            />
            {errors.address_line_1 && (
              <p className="text-sm text-red-500 mt-1">
                {errors.address_line_1}
              </p>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block font-semibold mb-1">Address Line 2</label>
            <input
              type="text"
              name="address_line_2"
              value={data.address_line_2}
              onChange={handleChange}
              className="form-input w-full"
              placeholder="Building, Landmark"
            />
            {errors.address_line_2 && (
              <p className="text-sm text-red-500 mt-1">
                {errors.address_line_2}
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block font-semibold mb-1">City</label>
            <input
              type="text"
              name="city"
              value={data.city}
              onChange={handleChange}
              className={`form-input w-full ${
                errors.city ? "border-red-500" : ""
              }`}
            />
            {errors.city && (
              <p className="text-sm text-red-500 mt-1">{errors.city}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block font-semibold mb-1">State</label>
            <input
              type="text"
              name="state"
              value={data.state}
              onChange={handleChange}
              className={`form-input w-full ${
                errors.state ? "border-red-500" : ""
              }`}
            />
            {errors.state && (
              <p className="text-sm text-red-500 mt-1">{errors.state}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block font-semibold mb-1">Country</label>
            <input
              type="text"
              name="country"
              value={data.country}
              onChange={handleChange}
              className={`form-input w-full ${
                errors.country ? "border-red-500" : ""
              }`}
            />
            {errors.country && (
              <p className="text-sm text-red-500 mt-1">{errors.country}</p>
            )}
          </div>

          {/* Pincode */}
          <div>
            <label className="block font-semibold mb-1">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={data.pincode}
              onChange={handleChange}
              className={`form-input w-full ${
                errors.pincode ? "border-red-500" : ""
              }`}
              inputMode="numeric"
            />
            {errors.pincode && (
              <p className="text-sm text-red-500 mt-1">{errors.pincode}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block font-semibold mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={data.status}
              onChange={handleChange}
              className={`form-select w-full ${
                errors.status ? "border-red-500" : ""
              }`}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-sm text-red-500 mt-1">{errors.status}</p>
            )}
          </div>

          {/* Submit */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
              disabled={processing}
            >
              {processing ? "Updating..." : "Update Office"}
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
