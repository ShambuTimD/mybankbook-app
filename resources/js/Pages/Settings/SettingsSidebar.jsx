// resources/js/Components/SettingsSidebar.jsx
import React from "react";

const SettingsSidebar = ({ active = "general" }) => {
    const menuItems = [
        { key: "general", label: "General", href: "/appsettings" },
        // { key: "company", label: "Company Info", href: "#" },
        // { key: "locale", label: "Locale", href: "#" },
        // { key: "finance", label: "Finance", href: "#" },
        // { key: "pages", label: "Page Links", href: "#" },
        // { key: "communication", label: "Communication", href: "#" },
        // { key: "system", label: "System Settings", href: "#" },
    ];

    return (
        <div className="w-full md:w-1/4 bg-white border rounded-lg shadow-sm">
            <div className="flex flex-col">
                {menuItems.map((item) => (
                    <a
                        key={item.key}
                        href={item.href}
                        className={`px-4 py-3 ${
                            active === item.key
                                ? "font-semibold text-blue-700 border-l-4 border-blue-700 bg-blue-50"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        {item.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default SettingsSidebar;
