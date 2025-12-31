import React, { useMemo, useState } from "react";
import { useForm, Head } from "@inertiajs/react";
import ComponentCard from "@/Components/common/ComponentCard";
import Label from "@/Components/form/Label";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 👈 eye icons
import Select from "react-select"; // For multi-select dropdown

export default function CreateCompanyUser({
  companies,
  offices,
  roles,
  title = "Company User",
}) {
  const {
    data,
    setData,
    post,
    processing,
    errors,
    setError,
    clearErrors,
  } = useForm({
    role_for: "",
    role_id: "",
    company_id: "",
    company_office_id: [], // multiple office IDs
    name: "",
    email: "",
    password: "",
    phone: "",
    status: "active",
    is_primary: false,
    is_tester: false,
  });

  const [selectedOffices, setSelectedOffices] = useState([]);
  const [showPassword, setShowPassword] = useState(false); // 👈 toggle state


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(name, type === "checkbox" ? checked : value);

    if (errors[name]) clearErrors(name);

    if (name === "role_for") {
      setData("role_id", "");
      clearErrors("role_id");
    }

    if (name === "company_id") {
      setData("company_office_id", []);
      setSelectedOffices([]);
      clearErrors("company_office_id");
    }
    if (name === "role_id") {
      const role = roles.find(r => String(r.id) === value);
      if (role?.role_name?.toLowerCase() === "company_admin") {
        setSelectedOffices([]);
        setData("company_office_id", []);
      }
    }

  };

  const handleOfficeChange = (selectedOptions) => {
    setSelectedOffices(selectedOptions);
    setData(
      "company_office_id",
      selectedOptions.map((option) => option.value)
    );
  };

  // filter roles by role_for
  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) => r.role_for?.toLowerCase() === data.role_for?.toLowerCase()
      ),
    [roles, data.role_for]
  );

  // filter offices by selected company
  const filteredOffices = useMemo(
    () =>
      offices.filter(
        (o) => String(o.company_id) === String(data.company_id)
      ),
    [offices, data.company_id]
  );

  // detect selected role
  const selectedRoleName = useMemo(() => {
    const r = roles.find((x) => String(x.id) === String(data.role_id));
    return r?.role_name?.toLowerCase() || "";
  }, [data.role_id, roles]);

  // Show/Require flags
  const showIsTester =
    selectedRoleName === "company_admin" ||
    selectedRoleName === "company_executive"

  const showIsPrimary =
    selectedRoleName === "company_admin" ||
    selectedRoleName === "company_executive";

  // ✅ Only require office if role is executive or exec manager
  const requireOffice =
    selectedRoleName === "company_executive"

  // ✅ Require company if role is admin or executive
  const requireCompany =
    selectedRoleName === "company_admin" ||
    selectedRoleName === "company_executive";

  // ---------------- VALIDATION ----------------
  const isEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  const digitsOnly = (v) => String(v || "").replace(/\D/g, "");

  const validate = () => {
    Object.keys(data).forEach((k) => clearErrors(k));
    const missing = [];

    const requiredMap = {
      role_for: "Role For",
      role_id: "Role",
      name: "Name",
      email: "Email",
      password: "Password",
      status: "Status",
    };
    if (requireCompany) requiredMap.company_id = "Company";
    if (requireOffice) requiredMap.company_office_id = "Office";

    Object.entries(requiredMap).forEach(([key, label]) => {
      if (!data[key] || String(data[key]).trim() === "") {
        setError(key, `${label} is required.`);
        missing.push(label);
      }
    });

    if (data.email && !isEmail(data.email)) {
      setError("email", "Please enter a valid email address.");
      missing.push("Valid Email");
    }

    if (
      String(data.password || "").length > 0 &&
      String(data.password || "").length < 6
    ) {
      setError("password", "Password must be at least 6 characters.");
      missing.push("Password (min 6 chars)");
    }

    if (data.phone && data.phone.trim() !== "") {
      const d = digitsOnly(data.phone);
      if (d.length < 7 || d.length > 20) {
        setError("phone", "Phone must contain 7 to 20 digits.");
        missing.push("Valid Phone");
      }
    }

    return missing;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const missing = validate();
    if (missing.length > 0) {
      alert("Please fix the following:\n" + missing.join("\n"));
      return;
    }

    post(route("companyUser.store"), {
      preserveScroll: true,
    });
  };

  return (
    <>
      <Head title={title} />
      <ComponentCard
        title={title}
        url={route("companyUser.index")}
        urlText={`Back to ${title}s`}
        urlIcon={faArrowLeft}
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Role & Permission */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Role & Permission
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="role_for">
                  Role For<span className="text-red-500">*</span>
                </Label>
                <select
                  id="role_for"
                  name="role_for"
                  value={data.role_for}
                  onChange={handleChange}
                  className={`form-select w-full ${errors.role_for ? "border-red-500" : ""
                    }`}
                >
                  <option value="">-- Select Role For --</option>
                  <option value="backend">Backend</option>
                  <option value="frontend">Frontend</option>
                </select>
                {errors.role_for && (
                  <p className="text-red-500 text-xs">{errors.role_for}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role_id">
                  Role<span className="text-red-500">*</span>
                </Label>
                <select
                  id="role_id"
                  name="role_id"
                  value={data.role_id}
                  onChange={handleChange}
                  className={`form-select w-full ${errors.role_id ? "border-red-500" : ""
                    }`}
                >
                  <option value="">-- Select Role --</option>
                  {filteredRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_title}
                    </option>
                  ))}
                </select>
                {errors.role_id && (
                  <p className="text-red-500 text-xs">{errors.role_id}</p>
                )}
              </div>
            </div>

            {showIsTester && (
              <div className="mt-4 flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_tester"
                    checked={data.is_tester}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Is Tester
                </label>

                {showIsPrimary && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_primary"
                      checked={data.is_primary}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Is Primary
                  </label>
                )}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="border rounded-md p-4 bg-white">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              User Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="company_id">
                  Company {requireCompany && <span className="text-red-500">*</span>}
                </Label>
                <select
                  id="company_id"
                  name="company_id"
                  value={data.company_id}
                  onChange={handleChange}
                  className={`form-select w-full ${errors.company_id ? "border-red-500" : ""
                    }`}
                  required={requireCompany}
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.company_id && (
                  <p className="text-red-500 text-xs">{errors.company_id}</p>
                )}
              </div>

              {/* <Label htmlFor="company_office_id">
                  Office
                </Label>
                <Select
                  id="company_office_id"
                  name="company_office_id"
                  value={selectedOffices}
                  onChange={handleOfficeChange}
                  options={filteredOffices.map((office) => ({
                    value: office.id,
                    label: office.office_name,
                  }))}
                  isMulti
                  placeholder="-- Select Office(s) --"
                  className={`${
                    errors.company_office_id ? "border-red-500" : ""
                  }`}
                  isDisabled={!data.company_id || selectedRoleName === "company_admin"}
                />
                {errors.company_office_id && (
                  <p className="text-red-500 text-xs">
                    {errors.company_office_id}
                  </p>
                )}
                </div> */}
              {/* Office Section — hide completely when role = company_admin */}
              {selectedRoleName !== "company_admin" && (
                <div>
                  <Label htmlFor="company_office_id">
                    Office {requireOffice && <span className="text-red-500">*</span>}
                  </Label>

                  <Select
                    id="company_office_id"
                    name="company_office_id"
                    value={selectedOffices}
                    onChange={handleOfficeChange}
                    options={filteredOffices.map((office) => ({
                      value: office.id,
                      label: office.office_name,
                    }))}
                    isMulti
                    placeholder="-- Select Office(s) --"
                    className={`${errors.company_office_id ? "border-red-500" : ""}`}
                    isDisabled={!data.company_id} // only disabled if no company selected
                  />

                  {errors.company_office_id && (
                    <p className="text-red-500 text-xs">{errors.company_office_id}</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="name">
                  Name<span className="text-red-500">*</span>
                </Label>
                <input
                  id="name"
                  name="name"
                  value={data.name}
                  onChange={handleChange}
                  className={`form-input w-full ${errors.name ? "border-red-500" : ""
                    }`}
                  placeholder="Enter full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">
                  Email<span className="text-red-500">*</span>
                </Label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={data.email}
                  onChange={handleChange}
                  className={`form-input w-full ${errors.email ? "border-red-500" : ""
                    }`}
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">
                  Password<span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"} // 👈 toggle type
                    value={data.password}
                    onChange={handleChange}
                    className={`form-input w-full pr-10 ${errors.password ? "border-red-500" : ""}`}
                    placeholder="Enter password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <input
                  id="phone"
                  name="phone"
                  value={data.phone}
                  onChange={handleChange}
                  className={`form-input w-full ${errors.phone ? "border-red-500" : ""
                    }`}
                  placeholder="Digits only"
                  inputMode="numeric"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">
                  Status<span className="text-red-500">*</span>
                </Label>
                <select
                  id="status"
                  name="status"
                  value={data.status}
                  onChange={handleChange}
                  className={`form-select w-full ${errors.status ? "border-red-500" : ""
                    }`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-xs">{errors.status}</p>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
            >
              {processing ? "Saving..." : `Create ${title}`}
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
