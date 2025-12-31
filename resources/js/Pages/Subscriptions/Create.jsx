import React, { useState } from "react";
import { Head, router } from "@inertiajs/react";
import ComponentCard from "@/Components/common/ComponentCard";
import Select from "react-select";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faTrash,
    faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

export default function Create({ title, billingCycles, statusOptions }) {
    const [form, setForm] = useState({
        name: "",
        slug: "",
        price: "",
        billing_cycle: "monthly",
        duration_days: "",
        trial_days: "",
        status: "active",
        features: [],
    });

    const addFeature = () => {
        setForm({
            ...form,
            features: [...form.features, { key: "", value: "" }],
        });
    };

    const removeFeature = (index) => {
        setForm({
            ...form,
            features: form.features.filter((_, i) => i !== index),
        });
    };

    const submit = (e) => {
        e.preventDefault();

        router.post(route("subscriptions.store"), form, {
            onSuccess: () => toast.success("Plan created successfully"),
            onError: () => toast.error("Please check the form"),
        });
    };

    return (
        <>
            <Head title={title} />

            <ComponentCard
                title={title}
                url={route("subscriptions.index")}
                urlText="Back to Plans"
                urlIcon={faArrowLeft}
            >
                <form onSubmit={submit} className="space-y-8">
                    {/* ================= BASIC INFO ================= */}
                    <section>
                        <h3 className="text-base font-semibold text-gray-700 mb-4">
                            Plan Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <Input
                                label="Plan Name"
                                value={form.name}
                                onChange={(v) => setForm({ ...form, name: v })}
                                required
                            />

                            <Input
                                label="Slug"
                                value={form.slug}
                                onChange={(v) => setForm({ ...form, slug: v })}
                                required
                            />

                            <Input
                                label="Price"
                                type="number"
                                value={form.price}
                                onChange={(v) => setForm({ ...form, price: v })}
                                required
                            />

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Billing Cycle
                                </label>
                                <Select
                                    options={billingCycles}
                                    value={billingCycles.find(
                                        (o) => o.value === form.billing_cycle
                                    )}
                                    onChange={(opt) =>
                                        setForm({
                                            ...form,
                                            billing_cycle: opt.value,
                                        })
                                    }
                                />
                            </div>

                            <Input
                                label="Duration (Days)"
                                type="number"
                                value={form.duration_days}
                                onChange={(v) =>
                                    setForm({ ...form, duration_days: v })
                                }
                            />

                            <Input
                                label="Trial Days"
                                type="number"
                                value={form.trial_days}
                                onChange={(v) =>
                                    setForm({ ...form, trial_days: v })
                                }
                            />

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Status
                                </label>
                                <Select
                                    options={statusOptions}
                                    value={statusOptions.find(
                                        (o) => o.value === form.status
                                    )}
                                    onChange={(opt) =>
                                        setForm({
                                            ...form,
                                            status: opt.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </section>

                    {/* ================= FEATURES ================= */}
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-semibold text-gray-700">
                                Plan Features
                            </h3>
                            <button
                                type="button"
                                onClick={addFeature}
                                className="text-sm flex items-center gap-2 text-blue-600"
                            >
                                <FontAwesomeIcon icon={faPlus} />
                                Add Feature
                            </button>
                        </div>

                        {form.features.length === 0 && (
                            <p className="text-sm text-gray-500">
                                No features added
                            </p>
                        )}

                        <div className="space-y-3">
                            {form.features.map((f, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
                                >
                                    <Input
                                        placeholder="feature_key (e.g. max_users)"
                                        value={f.key}
                                        onChange={(v) => {
                                            const features = [...form.features];
                                            features[index].key = v;
                                            setForm({ ...form, features });
                                        }}
                                    />

                                    <Input
                                        placeholder="feature_value (e.g. 10 / true)"
                                        value={f.value}
                                        onChange={(v) => {
                                            const features = [...form.features];
                                            features[index].value = v;
                                            setForm({ ...form, features });
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeFeature(index)}
                                        className="text-red-600 text-sm"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ================= ACTIONS ================= */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() =>
                                router.visit(route("subscriptions.index"))
                            }
                            className="px-4 py-2 border rounded-lg text-sm"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm"
                        >
                            Create Plan
                        </button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
}

/* ================= SMALL INPUT ================= */
const Input = ({
    label,
    value,
    onChange,
    type = "text",
    required = false,
    placeholder = "",
}) => (
    <div className="flex flex-col">
        {label && (
            <label className="text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="border rounded-lg px-3 py-2 text-sm"
            required={required}
        />
    </div>
);
