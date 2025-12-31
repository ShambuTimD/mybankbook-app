// resources/js/Pages/CompanyUser/Edit.jsx
import React, { useMemo, useState } from "react";
import { useForm, Head } from "@inertiajs/react";
import ComponentCard from "@/Components/common/ComponentCard";
import Label from "@/Components/form/Label";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // 👈 add icons

export default function EditCompanyUser({
  user,
  companies,
  offices,
  roles,
  title = "Company User",
}) {
  const initialOfficeArray = useMemo(() => {
    // user.company_office_id is CSV or null
    if (!user?.company_office_id) return [];
    return String(user.company_office_id)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [user?.company_office_id]);

  const {
    data,
    setData,
    put,
    processing,
    errors,
    setError,
    clearErrors,
  } = useForm({
    role_for: user?.role_for ?? "",
    role_id: user?.role_id ?? "",
    company_id: user?.company_id ?? "",
    company_office_id: initialOfficeArray, // ARRAY of office IDs (strings)
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    phone: user?.phone ?? "",
    status: user?.status ?? "active",
    is_primary: Boolean(user?.is_primary) ?? false,
    is_tester: Boolean(user?.is_tester) ?? false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(name, type === "checkbox" ? checked : value);

    if (errors[name]) clearErrors(name);

    if (name === "role_for") setData("role_id", "");
    if (name === "company_id") setData("company_office_id", []); // reset offices if company changed
  };

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) => r.role_for?.toLowerCase() === data.role_for?.toLowerCase()
      ),
    [roles, data.role_for]
  );

  const filteredOffices = useMemo(
    () => offices.filter((o) => String(o.company_id) === String(data.company_id)),
    [offices, data.company_id]
  );

  const officeOptions = useMemo(
    () =>
      filteredOffices.map((o) => ({
        value: String(o.id),
        label: o.office_name,
      })),
    [filteredOffices]
  );

  const selectedRoleName = useMemo(() => {
    const r = roles.find((x) => String(x.id) === String(data.role_id));
    return r?.role_name?.toLowerCase() || "";
  }, [data.role_id, roles]);

  const showIsTester = ["company_admin", "company_executive"].includes(
    selectedRoleName
  );
  const showIsPrimary = selectedRoleName === "company_admin";
  const requireCompany = ["company_admin", "company_executive"].includes(
    selectedRoleName
  );
  const requireOffice = ["company_executive", "company_executive_manager"].includes(
    selectedRoleName
  );

  const handleOfficeChange = (selected) => {
    // selected is array of {value,label}
    const values = (selected || []).map((opt) => opt.value);
    setData("company_office_id", values);
    if (errors.company_office_id) clearErrors("company_office_id");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const requiredMap = {
      role_for: "Role For",
      role_id: "Role",
      name: "Name",
      email: "Email",
      status: "Status",
    };
    if (requireCompany) requiredMap.company_id = "Company";
    if (requireOffice) requiredMap.company_office_id = "Office(s)";

    const missing = Object.entries(requiredMap)
      .filter(([k]) => {
        const v = data[k];
        if (Array.isArray(v)) return v.length === 0;
        return !v || String(v).trim() === "";
      })
      .map(([k, label]) => ({ key: k, label }));

    if (missing.length) {
      missing.forEach(({ key, label }) =>
        setError(key, `${label} is required.`)
      );
      alert(
        "Please fill the following fields:\n" +
        missing.map((m) => m.label).join("\n")
      );
      return;
    }

    // PUT as-is; controller will implode company_office_id array into CSV
    put(route("companyUser.update", user.id), {
      preserveScroll: true,
    });
  };

  const selectedOfficeOptions = useMemo(() => {
    const setIds = new Set((data.company_office_id || []).map(String));
    return officeOptions.filter((opt) => setIds.has(opt.value));
  }, [officeOptions, data.company_office_id]);

  return (
    <>
      <Head title={`Edit ${title}`} />
      <ComponentCard
        title={`Edit ${title}`}
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
                <Label htmlFor="role_for">Role For</Label>
                <select
                  id="role_for"
                  name="role_for"
                  value={data.role_for}
                  onChange={handleChange}
                  className={`form-select w-full ${errors.role_for ? "border-red-500" : ""
                    }`}
                  disabled
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
                <Label htmlFor="role_id">Role</Label>
                <select
                  id="role_id"
                  name="role_id"
                  value={data.role_id}
                  onChange={handleChange}
                  className={`form-select w-full ${errors.role_id ? "border-red-500" : ""
                    }`}
                  disabled
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
                    disabled
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
                      disabled
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
                  Company {requireCompany && "*"}
                </Label>
                <select
                  id="company_id"
                  name="company_id"
                  value={data.company_id}
                  onChange={handleChange}
                  className={`form-select w-full ${errors.company_id ? "border-red-500" : ""
                    }`}
                  required={requireCompany}
                  disabled
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

              {/* EDITABLE multi-select Office field */}
              {selectedRoleName !== "company_admin" && (
                <div>
                  <Label htmlFor="company_office_id">
                    Office {requireOffice && "*"}
                  </Label>

                  <Select
                    inputId="company_office_id"
                    isMulti
                    isClearable
                    options={officeOptions}
                    value={selectedOfficeOptions}
                    onChange={handleOfficeChange}
                    isDisabled={!data.company_id} // now only disables if no company selected
                    placeholder="Select one or more offices"
                    classNamePrefix="react-select"
                  />

                  {errors.company_office_id && (
                    <p className="text-red-500 text-xs">{errors.company_office_id}</p>
                  )}
                </div>
              )}


              <div>
                <Label htmlFor="name">Name</Label>
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
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={data.email}
                  onChange={handleChange}
                  className={`form-input w-full ${errors.email ? "border-red-500" : ""
                    }`}
                  placeholder="Enter email"
                  readOnly
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}   // 👈 toggle type
                    value={data.password}
                    onChange={handleChange}
                    className={`form-input w-full pr-10 ${errors.password ? "border-red-500" : ""}`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)} // 👈 toggle state
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
                  placeholder="Enter mobile number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
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
              {processing ? "Saving..." : `Update ${title}`}
            </button>
          </div>
        </form>
      </ComponentCard>
    </>
  );
}
