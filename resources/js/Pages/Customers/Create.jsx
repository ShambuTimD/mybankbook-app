import { useForm, Head } from "@inertiajs/react";
import { useState } from "react";
import ComponentCard from "@/Components/common/ComponentCard";
import Label from "@/Components/form/Label";
import Input from "@/Components/form/input/InputField";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function CreateCustomer() {
    const { data, setData, post, processing, errors } = useForm({
        first_name: "",
        last_name: "",
        email_id: "",
        phone_number: "",
        passcode: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // console.log('submitting data', data);
        // return;
        post(route("customer.store"), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Create Customer" />
            <ComponentCard
                title="Create New Customer"
                url={route("customer.index")}
                urlText="Back to Customers"
                urlIcon={faArrowLeft}
            >
                <form
                    onSubmit={handleSubmit}
                    className="grid gap-4 md:grid-cols-2"
                >
                    {/* First Name */}
                    <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                            id="first_name"
                            type="text"
                            value={data.first_name}
                            onChange={(e) =>
                                setData("first_name", e.target.value)
                            }
                            placeholder="Enter first name"
                        />
                        {errors.first_name && (
                            <p className="text-red-500 text-xs">
                                {errors.first_name}
                            </p>
                        )}
                    </div>

                    {/* Last Name */}
                    <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                            id="last_name"
                            type="text"
                            value={data.last_name}
                            onChange={(e) =>
                                setData("last_name", e.target.value)
                            }
                            placeholder="Enter last name"
                        />
                        {errors.last_name && (
                            <p className="text-red-500 text-xs">
                                {errors.last_name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <Label htmlFor="email_id">Email</Label>
                        <Input
                            id="email_id"
                            type="email"
                            value={data.email_id}
                            onChange={(e) =>
                                setData("email_id", e.target.value)
                            }
                            placeholder="example@mail.com"
                        />
                        {errors.email_id && (
                            <p className="text-red-500 text-xs">
                                {errors.email_id}
                            </p>
                        )}
                    </div>

                    {/* Phone Number */}
                    <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                            id="phone_number"
                            type="tel"
                            value={data.phone_number}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters
                                if (value.length <= 10) {
                                    setData("phone_number", value);
                                }
                            }}
                            placeholder="Enter 10-digit phone number"
                            inputMode="numeric"
                            maxLength={10}
                        />
                        {errors.phone_number && (
                            <p className="text-red-500 text-xs">
                                {errors.phone_number}
                            </p>
                        )}
                    </div>

                    {/* Passcode */}
                    <div>
                        <Label htmlFor="passcode">Passcode</Label>
                        <Input
                            id="passcode"
                            type="text"
                            value={data.passcode}
                            onChange={(e) =>
                                setData("passcode", e.target.value)
                            }
                            placeholder="Optional passcode"
                        />
                        {errors.passcode && (
                            <p className="text-red-500 text-xs">
                                {errors.passcode}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-blue-600"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="col-span-2 text-right mt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Create Customer"}
                        </button>
                    </div>
                </form>
            </ComponentCard>
        </>
    );
}
