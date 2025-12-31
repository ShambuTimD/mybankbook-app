// Create.jsx
import React, { useState, useEffect } from "react";
import { router, Head } from "@inertiajs/react";
import Select from "react-select";
import axios from "axios";
import toast from "react-hot-toast";

export default function Create({ title, categories }) {
    const [form, setForm] = useState({
        category_id: "",
        sort_order: "",
        question: "",
        answer: "",
        is_active: 1,
    });

    const [errors, setErrors] = useState({
        sort_order: "",
    });

    const [checking, setChecking] = useState(false);

    // 🔍 Validate Sort Order Before Submit
    const validateSortOrder = async (category_id, sort_order) => {
        if (!category_id || !sort_order) {
            setErrors((prev) => ({ ...prev, sort_order: "" }));
            return;
        }

        setChecking(true);

        try {
            const res = await axios.post(route("support.faq.checkSortOrder"), {
                category_id,
                sort_order,
            });

            if (res.data.exists) {
                setErrors((prev) => ({
                    ...prev,
                    sort_order: "This sort order already exists in this category.",
                }));
            } else {
                setErrors((prev) => ({ ...prev, sort_order: "" }));
            }
        } catch (e) {
            console.error(e);
        }

        setChecking(false);
    };

    // Auto validate when category or sort order changes
    useEffect(() => {
        validateSortOrder(form.category_id, form.sort_order);
    }, [form.category_id, form.sort_order]);

    // Form Submit
    const handleSubmit = () => {
        if (errors.sort_order) {
            toast.error("Fix errors before submitting");
            return;
        }

        router.post(route("support.faq.store"), form);
    };

    return (
        <div className="p-6">
            <Head title="Create FAQ" />
            <h1 className="text-xl font-semibold mb-4">Create New FAQ</h1>

            <div className="bg-white p-6 rounded-xl shadow">

                {/* Row 1 */}
                <div className="grid grid-cols-2 gap-6">

                    {/* Category */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">
                            Category *
                        </label>
                        <Select
                            options={categories.map((c) => ({
                                value: c.id,
                                label: c.name,
                            }))}
                            placeholder="Select category"
                            onChange={(e) =>
                                setForm({ ...form, category_id: e.value })
                            }
                        />
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-sm mb-1 font-medium">
                            Sort Order *
                        </label>

                        <input
                            type="number"
                            className={`w-full border rounded-lg px-3 py-2 ${
                                errors.sort_order ? "border-red-500" : ""
                            }`}
                            value={form.sort_order}
                            onChange={(e) =>
                                setForm({ ...form, sort_order: e.target.value })
                            }
                        />

                        {errors.sort_order && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.sort_order}
                            </p>
                        )}
                    </div>
                </div>

                {/* Question */}
                <div className="mt-6">
                    <label className="block text-sm mb-1 font-medium">
                        Question *
                    </label>
                    <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2"
                        value={form.question}
                        onChange={(e) =>
                            setForm({ ...form, question: e.target.value })
                        }
                    />
                </div>

                {/* Answer */}
                <div className="mt-6">
                    <label className="block text-sm mb-1 font-medium">
                        Answer *
                    </label>
                    <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        rows="4"
                        value={form.answer}
                        onChange={(e) =>
                            setForm({ ...form, answer: e.target.value })
                        }
                    ></textarea>
                </div>

                {/* Status */}
                <div className="mt-6">
                    <label className="block text-sm mb-1 font-medium">
                        Status
                    </label>
                    <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={form.is_active}
                        onChange={(e) =>
                            setForm({ ...form, is_active: e.target.value })
                        }
                    >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                {/* Submit */}
                <div className="mt-6 text-right">
                    <button
                        disabled={errors.sort_order || checking}
                        className={`px-6 py-2 rounded-lg text-white ${
                            errors.sort_order || checking
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-purple-600"
                        }`}
                        onClick={handleSubmit}
                    >
                        {checking ? "Checking..." : "Create FAQ"}
                    </button>
                </div>
            </div>
        </div>
    );
}
