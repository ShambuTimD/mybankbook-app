//import { useForm } from '@inertiajs/react';
import { useForm, Head } from "@inertiajs/react";
import { useState } from "react";
import ComponentCard from "@/Components/common/ComponentCard";
import Label from "@/Components/form/Label";
import Input from "@/Components/form/input/InputField";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function CreateCompany() {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        phone: "",
        alternate_phone: "",
        website: "",
        gst_number: "",
        pan_number: "",
        industry_type: "",
        company_size: "",
        registration_type: "",
        address_line_1: "",
        address_line_2: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        logo: null,
        status: "active",
    });

    const handleSubmit = (e) => {
    e.preventDefault();

    // Map each form key to its readable label
    const requiredFields = {
        name: "Company Name",
        phone: "Phone",
        email: "Email",
        address_line_1: "Address Line 1",
        city: "City",
        state: "State",
        country: "Country",
        pincode: "Pincode",
        status: "Status"
    };

    // Find which required fields are missing
    const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !data[key] || data[key].toString().trim() === "")
        .map(([_, label]) => label);

    if (missingFields.length > 0) {
        alert("Please fill the following fields:\n" + missingFields.join("\n"));
        return;
    }

    // Submit if all required fields are filled
    post(route("companies.store"), {
        preserveScroll: true,
        forceFormData: true,
    });
};



    return (
        <>
            <Head title="Add Company" />
            <ComponentCard
                title="Create New Company"
                url={route("companies.index")}
                urlText="Back to Companies"
                urlIcon={faArrowLeft}
            >
                <form
                    onSubmit={handleSubmit}
                    className="grid gap-4 md:grid-cols-2"
                >
                    {/* Name */}
                    <div>
                        <Label htmlFor="name">Company Name<span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Enter company name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <Label htmlFor="email">Email<span className="text-red-500">*</span></Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                            placeholder="Enter email"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <Label htmlFor="phone">Phone<span className="text-red-500">*</span></Label>
                        <Input
                            id="phone"
                            value={data.phone}
                            type="tel"
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
                                if (value.length <= 10) {
                                    setData("phone", value);
                                }
                            }}
                            placeholder="Enter primary phone"
                            inputMode="numeric"
                            maxLength={10}
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-xs">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    {/* Alternate Phone */}
                    <div>
                        <Label htmlFor="alternate_phone">Alternate Phone</Label>
                        <Input
                            id="alternate_phone"
                            value={data.alternate_phone}
                            type="tel"
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
                                if (value.length <= 10) {
                                    setData("alternate_phone", value);
                                }
                            }}
                            placeholder="Enter alternate phone"
                            inputMode="numeric"
                            maxLength={10}
                        />
                        {errors.alternate_phone && (
                            <p className="text-red-500 text-xs">
                                {errors.alternate_phone}
                            </p>
                        )}
                    </div>

                    {/* Website */}
                    <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            value={data.website}
                            onChange={(e) => setData("website", e.target.value)}
                            placeholder="Enter website URL"
                        />
                        {errors.website && (
                            <p className="text-red-500 text-xs">
                                {errors.website}
                            </p>
                        )}
                    </div>

                    {/* GST Number */}
                    <div>
                        <Label htmlFor="gst_number">GST Number</Label>
                        <Input
                            id="gst_number"
                            value={data.gst_number}
                            onChange={(e) =>
                                setData("gst_number", e.target.value)
                            }
                            placeholder="Enter GST number"
                        />
                        {errors.gst_number && (
                            <p className="text-red-500 text-xs">
                                {errors.gst_number}
                            </p>
                        )}
                    </div>

                    {/* PAN Number */}
                    <div>
                        <Label htmlFor="pan_number">PAN Number</Label>
                        <Input
                            id="pan_number"
                            value={data.pan_number}
                            onChange={(e) =>
                                setData("pan_number", e.target.value)
                            }
                            placeholder="Enter PAN number"
                        />
                        {errors.pan_number && (
                            <p className="text-red-500 text-xs">
                                {errors.pan_number}
                            </p>
                        )}
                    </div>

                    {/* Industry Type */}
                    <div>
                        <Label htmlFor="industry_type">Industry Type</Label>
                        <Input
                            id="industry_type"
                            value={data.industry_type}
                            onChange={(e) =>
                                setData("industry_type", e.target.value)
                            }
                            placeholder="e.g., IT, Healthcare"
                        />
                        {errors.industry_type && (
                            <p className="text-red-500 text-xs">
                                {errors.industry_type}
                            </p>
                        )}
                    </div>

                    {/* Company Size */}
                    <div>
                        <Label htmlFor="company_size">Company Size</Label>
                        <Input
                            id="company_size"
                            value={data.company_size}
                            onChange={(e) =>
                                setData("company_size", e.target.value)
                            }
                            placeholder="e.g., 50-100 employees"
                        />
                        {errors.company_size && (
                            <p className="text-red-500 text-xs">
                                {errors.company_size}
                            </p>
                        )}
                    </div>

                    {/* Registration Type */}
                    <div>
                        <Label htmlFor="registration_type">
                            Registration Type
                        </Label>
                        <Input
                            id="registration_type"
                            value={data.registration_type}
                            onChange={(e) =>
                                setData("registration_type", e.target.value)
                            }
                            placeholder="e.g., Private Ltd"
                        />
                        {errors.registration_type && (
                            <p className="text-red-500 text-xs">
                                {errors.registration_type}
                            </p>
                        )}
                    </div>

                    {/* Address Line 1 */}
                    <div>
                        <Label htmlFor="address_line_1">Address Line 1<span className="text-red-500">*</span></Label>
                        <Input
                            id="address_line_1"
                            value={data.address_line_1}
                            onChange={(e) =>
                                setData("address_line_1", e.target.value)
                            }
                            placeholder="Street, Area"
                        />
                        {errors.address_line_1 && (
                            <p className="text-red-500 text-xs">
                                {errors.address_line_1}
                            </p>
                        )}
                    </div>

                    {/* Address Line 2 */}
                    <div>
                        <Label htmlFor="address_line_2">Address Line 2</Label>
                        <Input
                            id="address_line_2"
                            value={data.address_line_2}
                            onChange={(e) =>
                                setData("address_line_2", e.target.value)
                            }
                            placeholder="Building, Landmark"
                        />
                        {errors.address_line_2 && (
                            <p className="text-red-500 text-xs">
                                {errors.address_line_2}
                            </p>
                        )}
                    </div>

                    {/* City */}
                    <div>
                        <Label htmlFor="city">City<span className="text-red-500">*</span></Label>
                        <Input
                            id="city"
                            value={data.city}
                            onChange={(e) => setData("city", e.target.value)}
                            placeholder="City name"
                        />
                        {errors.city && (
                            <p className="text-red-500 text-xs">
                                {errors.city}
                            </p>
                        )}
                    </div>

                    {/* State */}
                    <div>
                        <Label htmlFor="state">State<span className="text-red-500">*</span></Label>
                        <Input
                            id="state"
                            value={data.state}
                            onChange={(e) => setData("state", e.target.value)}
                            placeholder="State"
                        />
                        {errors.state && (
                            <p className="text-red-500 text-xs">
                                {errors.state}
                            </p>
                        )}
                    </div>

                    {/* Country */}
                    <div>
                        <Label htmlFor="country">Country<span className="text-red-500">*</span></Label>
                        <Input
                            id="country"
                            value={data.country}
                            onChange={(e) => setData("country", e.target.value)}
                            placeholder="Country"
                        />
                        {errors.country && (
                            <p className="text-red-500 text-xs">
                                {errors.country}
                            </p>
                        )}
                    </div>

                    {/* Pincode */}
                    <div>
                        <Label htmlFor="pincode">Pincode<span className="text-red-500">*</span></Label>
                        <Input
                            id="pincode"
                            value={data.pincode}
                            onChange={(e) => setData("pincode", e.target.value)}
                            placeholder="Postal code"
                        />
                        {errors.pincode && (
                            <p className="text-red-500 text-xs">
                                {errors.pincode}
                            </p>
                        )}
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <Label htmlFor="logo">Company Logo</Label>
                        <input
                            id="logo"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setData("logo", e.target.files[0])}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.logo && (
                            <p className="text-red-500 text-xs">
                                {errors.logo}
                            </p>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <Label htmlFor="status">Status<span className="text-red-500">*</span></Label>
                        <select
                            id="status"
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                            className="w-full border px-3 py-2 rounded"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {errors.status && (
                            <p className="text-red-500 text-xs">
                                {errors.status}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="col-span-2 text-right mt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Create Company"}
                        </button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
}
