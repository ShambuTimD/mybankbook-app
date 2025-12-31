import { useForm } from "@inertiajs/react";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function CategoryCreateForm({ show, onClose, onSuccess }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        sort_order: "",
        is_active: 1,
    });

    const [localErrors, setLocalErrors] = useState({
        sort_order: "",
    });

    const [checking, setChecking] = useState(false);

    // 🔍 Validate sort order before submit
    const checkSortOrder = async (sort_order) => {
        if (!sort_order) {
            setLocalErrors({ sort_order: "" });
            return;
        }

        setChecking(true);

        try {
            const res = await axios.post(route("faq.category.checkSortOrder"), {
                sort_order,
            });

            if (res.data.exists) {
                setLocalErrors({
                    sort_order: "This sort order already exists.",
                });
            } else {
                setLocalErrors({ sort_order: "" });
            }
        } catch (err) {
            console.error(err);
        }

        setChecking(false);
    };

    // Auto-check when sort order changes
    useEffect(() => {
        checkSortOrder(data.sort_order);
    }, [data.sort_order]);

    // Submit
    const handleSubmit = (e) => {
        e.preventDefault();

        if (localErrors.sort_order) {
            toast.error("Fix errors before submitting");
            return;
        }

        post(route("faq.category.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Category created successfully!");
                reset();
                onSuccess();
                onClose();
            },
            onError: () => {
                toast.error("Validation failed");
            },
        });
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                <h2 className="text-lg font-semibold mb-4">Create FAQ Category</h2>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            className="w-full border px-3 py-2 rounded"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Enter category name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-xs">{errors.name}</p>
                        )}
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Sort Order<span className="text-red-500">*</span>
                        </label>

                        <input
                            className={`w-full border px-3 py-2 rounded ${
                                localErrors.sort_order ? "border-red-500" : ""
                            }`}
                            type="number"
                            value={data.sort_order}
                            onChange={(e) => setData("sort_order", e.target.value)}
                            placeholder="e.g., 1, 2, 3"
                        />

                        {localErrors.sort_order && (
                            <p className="text-red-500 text-xs mt-1">
                                {localErrors.sort_order}
                            </p>
                        )}

                        {checking && (
                            <p className="text-gray-500 text-xs mt-1">
                                Checking...
                            </p>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Status
                        </label>
                        <select
                            className="w-full border px-3 py-2 rounded"
                            value={data.is_active}
                            onChange={(e) => setData("is_active", e.target.value)}
                        >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                        </select>
                        {errors.is_active && (
                            <p className="text-red-500 text-xs">{errors.is_active}</p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-2 pt-2">
                        <button
                            type="button"
                            className="px-4 py-2 rounded bg-gray-200"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing || checking || localErrors.sort_order}
                            className={`px-4 py-2 rounded text-white ${
                                processing || checking || localErrors.sort_order
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600"
                            }`}
                        >
                            {processing ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
