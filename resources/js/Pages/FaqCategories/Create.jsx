import { useForm } from "@inertiajs/react";
import toast from "react-hot-toast";

export default function CategoryCreateForm({ onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        description: "",
        sort_order: "",
        is_active: 1,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route("faq.category.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success("Category created successfully");
                onClose();
            },
            onError: () => toast.error("Failed to create category"),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">

            {/* NAME */}
            <div>
                <label className="form-label">Category Name</label>
                <input
                    type="text"
                    className="form-control"
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="Enter category name"
                />
                {errors.name && (
                    <p className="text-red-500 text-xs">{errors.name}</p>
                )}
            </div>

            {/* DESCRIPTION */}
            <div>
                <label className="form-label">Description</label>
                <textarea
                    className="form-control"
                    rows="3"
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    placeholder="Enter description"
                />
                {errors.description && (
                    <p className="text-red-500 text-xs">{errors.description}</p>
                )}
            </div>

            {/* SORT ORDER */}
            <div>
                <label className="form-label">Sort Order</label>
                <input
                    type="number"
                    className="form-control"
                    value={data.sort_order}
                    onChange={(e) => setData("sort_order", e.target.value)}
                    placeholder="1"
                />
                {errors.sort_order && (
                    <p className="text-red-500 text-xs">{errors.sort_order}</p>
                )}
            </div>

            {/* STATUS */}
            <div>
                <label className="form-label">Status</label>
                <select
                    className="form-control"
                    value={data.is_active}
                    onChange={(e) => setData("is_active", e.target.value)}
                >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>
                {errors.is_active && (
                    <p className="text-red-500 text-xs">{errors.is_active}</p>
                )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="text-right">
                <button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
                >
                    {processing ? "Saving..." : "Create Category"}
                </button>
            </div>

        </form>
    );
}
