import React, { useState, useEffect } from "react";
import { router, Head } from "@inertiajs/react";
import Select from "react-select";
import axios from "axios";
import toast from "react-hot-toast";

export default function Create({ title, customers }) {

    const [form, setForm] = useState({
        user_id: "",
        subject: "",
        category: "",
        priority: "",
        description: "",
        ticket_no: "",
    });

    const categoryOptions = [
        { value: "Technical and Bugs", label: "Technical and Bugs" },
        { value: "Account", label: "Account" },
        { value: "Payment", label: "Payment" },
        { value: "General", label: "General" },
    ];

    const priorityOptions = [
        { value: "Low", label: "Low" },
        { value: "Medium", label: "Medium" },
        { value: "High", label: "High" },
    ];

    // Auto ticket number
    useEffect(() => {
        const code =
            new Date().toISOString().slice(0, 10) +
            "-PRESSPR-" +
            Math.random().toString(36).substring(2, 6);

        setForm((f) => ({ ...f, ticket_no: code }));
    }, []);

    const submitForm = () => {
        axios
            .post(route("support.tickets.store"), form)
            .then(() => {
                toast.success("Ticket Created Successfully");
                router.visit(route("support.tickets.index"));
            })
            .catch((error) => {
                if (error.response?.data?.errors) {
                    const errors = error.response.data.errors;
                    const firstKey = Object.keys(errors)[0];
                    toast.error(errors[firstKey][0]);
                } else {
                    toast.error("Something went wrong!");
                }
            });
    };

    return (
        <div className="p-6">
            <Head title="Create Ticket" />

            {/* Page Header */}
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Create Ticket</h1>

                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-full"
                    onClick={() => router.visit(route("support.tickets.index"))}
                >
                    ← Back to Ticket List
                </button>
            </div>

            {/* White Card */}
            <div className="bg-white shadow rounded-xl p-6">

                {/* Form Grid */}
                <div className="grid grid-cols-2 gap-6">

                    {/* Customer */}
                    <div>
                        <label className="block text-sm font-medium">
                            Company User<span className="text-red-500">*</span>
                        </label>

                        <Select
                            options={customers}
                            placeholder="Select..."
                            onChange={(e) => setForm({ ...form, user_id: e.value })}
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium">
                            Enquiry <span className="text-red-500">*</span>
                        </label>

                        <Select
                            options={categoryOptions}
                            placeholder="Select..."
                            onChange={(e) => setForm({ ...form, category: e.value })}
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium">
                            Subject <span className="text-red-500">*</span>
                        </label>

                        <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="Enter ticket subject"
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium">
                            Priority <span className="text-red-500">*</span>
                        </label>

                        <Select
                            options={priorityOptions}
                            placeholder="Select..."
                            onChange={(e) => setForm({ ...form, priority: e.value })}
                        />
                    </div>

                    {/* Ticket No */}
                    <div>
                        <label className="block text-sm font-medium">Ticket No</label>

                        <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                            value={form.ticket_no}
                            readOnly
                        />
                    </div>
                </div>

                {/* Message */}
                <div className="mt-6">
                    <label className="block text-sm font-medium">Message</label>

                    <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        rows="4"
                        placeholder="Enter ticket message"
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                    ></textarea>
                </div>

                {/* Submit */}
                <div className="mt-6 text-right">
                    <button
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg"
                        onClick={submitForm}
                    >
                        Create Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}
