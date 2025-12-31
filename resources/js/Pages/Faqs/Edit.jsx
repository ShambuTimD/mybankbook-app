import { useForm, Head, usePage, router } from "@inertiajs/react";
import ComponentCard from "@/Components/common/ComponentCard";
import Label from "@/Components/form/Label";
import Input from "@/Components/form/input/InputField";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

export default function EditFAQ() {
    const { faq, categories } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        category_id: faq.category_id ?? "",
        question: faq.question ?? "",
        answer: faq.answer ?? "",
        sort_order: faq.sort_order ?? "",
        is_active: faq.is_active ?? 1,
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Required Fields Validation
        const required = {
            category_id: "FAQ Category",
            question: "Question",
            answer: "Answer",
        };

        const missing = Object.entries(required)
            .filter(([key]) => !data[key] || data[key].toString().trim() === "")
            .map(([_, label]) => label);

        if (missing.length > 0) {
            alert("Please fill:\n" + missing.join("\n"));
            return;
        }

        post(route("support.faq.update", faq.id), {
            preserveScroll: true,
            onSuccess: () => toast.success("FAQ updated successfully"),
            onError: () => toast.error("Please correct errors"),
        });
    };

    return (
        <>
            <Head title="Edit FAQ" />

            <ComponentCard
                title="Edit FAQ"
                url={route("support.faq.index")}
                urlText="Back to FAQs"
                urlIcon={faArrowLeft}
            >
                <form
                    onSubmit={handleSubmit}
                    className="grid gap-4 md:grid-cols-2"
                >
                    {/* Category */}
                    <div>
                        <Label htmlFor="category_id">
                            Category <span className="text-red-500">*</span>
                        </Label>

                        <select
                            id="category_id"
                            className="w-full border px-3 py-2 rounded"
                            value={data.category_id}
                            onChange={(e) =>
                                setData("category_id", e.target.value)
                            }
                        >
                            <option value="">Select Category</option>
                            {categories?.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        {errors.category_id && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.category_id}
                            </p>
                        )}
                    </div>

                    {/* Sort Order */}
                    <div>
                        <Label htmlFor="sort_order">
                            Sort Order <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="sort_order"
                            type="number"
                            placeholder="0"
                            value={data.sort_order}
                            onChange={(e) =>
                                setData("sort_order", e.target.value)
                            }
                        />

                        {errors.sort_order && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.sort_order}
                            </p>
                        )}
                    </div>

                    {/* Question */}
                    <div className="col-span-2">
                        <Label htmlFor="question">
                            Question <span className="text-red-500">*</span>
                        </Label>

                        <Input
                            id="question"
                            placeholder="Enter FAQ question"
                            value={data.question}
                            onChange={(e) =>
                                setData("question", e.target.value)
                            }
                        />

                        {errors.question && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.question}
                            </p>
                        )}
                    </div>

                    {/* Answer */}
                    <div className="col-span-2">
                        <Label htmlFor="answer">
                            Answer <span className="text-red-500">*</span>
                        </Label>

                        <textarea
                            id="answer"
                            className="w-full border px-3 py-2 rounded"
                            rows="4"
                            placeholder="Enter FAQ answer"
                            value={data.answer}
                            onChange={(e) =>
                                setData("answer", e.target.value)
                            }
                        ></textarea>

                        {errors.answer && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.answer}
                            </p>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <Label htmlFor="is_active">Status</Label>

                        <select
                            id="is_active"
                            className="w-full border px-3 py-2 rounded"
                            value={data.is_active}
                            onChange={(e) =>
                                setData("is_active", e.target.value)
                            }
                        >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                    </div>

                    {/* Submit */}
                    <div className="col-span-2 text-right mt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Update FAQ"}
                        </button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
}
