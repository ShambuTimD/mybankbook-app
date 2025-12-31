import React from "react";
import { useForm, Head } from "@inertiajs/react";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";

export default function CreateOffice({ companies }) {
    const { data, setData, post, processing, errors } = useForm({
        company_id: "",
        office_name: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        status: "active",
        allowed_collection_mode: ['at_clinic'], // Added for multiple collection modes
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // If it's a checkbox, we need to manage the array
        if (name === "allowed_collection_mode") {
            const newSelectedModes = [...data.allowed_collection_mode];
            if (e.target.checked) {
                newSelectedModes.push(value);
            } else {
                const index = newSelectedModes.indexOf(value);
                if (index > -1) {
                    newSelectedModes.splice(index, 1);
                }
            }
            setData("allowed_collection_mode", newSelectedModes);
        } else {
            setData(name, value);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Map of field keys to their readable labels
        const requiredFields = {
            company_id: "Company",
            office_name: "Office Name",
            // address_line_1: "Address Line 1",
            status: "Status",
        };

        // Collect missing fields
        const missing = Object.entries(requiredFields)
            .filter(([key]) => !data[key] || data[key].toString().trim() === "")
            .map(([_, label]) => label);

        if (missing.length > 0) {
            alert("Please fill the following fields:\n" + missing.join("\n"));
            return;
        }

        // Log the data before submitting
        console.log("Submitting data:", data);
        // return;

        // Submit with PUT to companyOffice.update
        post(route("companyOffice.store"), {
            preserveScroll: true,
            onFinish: (response) => {
                // Log the submission response
                console.log("Submission response:", response);

                // You can also handle the response here (e.g., showing a success message or error)
            },
        });
    };

    return (
        <>
            <Head title="Create Company Office" />
            <PageBreadcrumb pageTitle="Create Company Office" />
            <ComponentCard title="New Company Office">
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {/* Company Dropdown */}
                    <div>
                        <label className="block font-semibold mb-1">
                            Company<span className="text-red-500">*</span>
                        </label>
                        <select
                            name="company_id"
                            value={data.company_id}
                            onChange={handleChange}
                            className="form-select w-full"
                        >
                            <option value="">-- Select Company --</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                        {errors.company_id && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.company_id}
                            </p>
                        )}
                    </div>

                    {/* Office Name */}
                    {/* <div>
            <label className="block font-semibold mb-1">Office Name<span className="text-red-500">*</span></label>
            <input
              type="text"
              name="office_name"
              value={data.office_name}
              onChange={handleChange}
              className="form-input w-full"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div> */}
                    <div>
                        <label className="block font-semibold mb-1">
                            Office Name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="office_name"
                            value={data.office_name}
                            onChange={handleChange}
                            className="form-input w-full"
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
                            Address Line 1
                        </label>
                        <input
                            type="text"
                            name="address_line_1"
                            value={data.address_line_1}
                            onChange={handleChange}
                            className="form-input w-full"
                        />
                    </div>

                    {/* Address Line 2 */}
                    <div>
                        <label className="block font-semibold mb-1">
                            Address Line 2
                        </label>
                        <input
                            type="text"
                            name="address_line_2"
                            value={data.address_line_2}
                            onChange={handleChange}
                            className="form-input w-full"
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block font-semibold mb-1">City</label>
                        <input
                            type="text"
                            name="city"
                            value={data.city}
                            onChange={handleChange}
                            className="form-input w-full"
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="block font-semibold mb-1">
                            State
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={data.state}
                            onChange={handleChange}
                            className="form-input w-full"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block font-semibold mb-1">
                            Country
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={data.country}
                            onChange={handleChange}
                            className="form-input w-full"
                        />
                    </div>

                    {/* Pincode */}
                    <div>
                        <label className="block font-semibold mb-1">
                            Pincode
                        </label>
                        <input
                            type="text"
                            name="pincode"
                            value={data.pincode}
                            onChange={handleChange}
                            className="form-input w-full"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block font-semibold mb-1">
                            Status<span className="text-red-500">*</span>
                        </label>
                        <select
                            name="status"
                            value={data.status}
                            onChange={handleChange}
                            className="form-select w-full"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {errors.status && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.status}
                            </p>
                        )}
                    </div>

                    {/* Collection Mode */}
                    <div>
                        <label className="block font-semibold mb-1">
                            Collection Mode
                        </label>
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="allowed_collection_mode"
                                    value="at_clinic"
                                    checked={data.allowed_collection_mode.includes(
                                        "at_clinic"
                                    )}
                                    onChange={handleChange}
                                    className="form-checkbox"
                                />
                                <label className="ml-2">At Clinic</label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="allowed_collection_mode"
                                    value="at_home"
                                    checked={data.allowed_collection_mode.includes(
                                        "at_home"
                                    )}
                                    onChange={handleChange}
                                    className="form-checkbox"
                                />
                                <label className="ml-2">At Home</label>
                            </div>
                        </div>
                        {errors.allowed_collection_mode && (
                            <p className="text-sm text-red-500 mt-1">
                                {errors.allowed_collection_mode}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
                            disabled={processing}
                        >
                            {processing ? "Creating..." : "Create Office"}
                        </button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
}
