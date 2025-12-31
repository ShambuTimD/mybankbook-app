import { useEffect, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { route } from "ziggy-js";
import { useSidebar } from "../Context/SidebarContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTableColumns,
    faUserTag,
    faUserGear,
    faChevronDown,
    faHeadphones,
    faIdCardAlt
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const AppSidebar = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const { url, props } = usePage();
    const { auth, settings } = props;

    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [subMenuHeight, setSubMenuHeight] = useState({});
    const subMenuRefs = useRef({});

    // ✅ New: local state for settings (from API)
    const [settingsData, setSettingsData] = useState({
        application_name: settings?.app_settings?.application_name || "",
        application_big_logo:
            settings?.app_settings?.application_big_logo || "",
    });

    // === Fetch Settings from /frontend/settings ===
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get(route("frontend.settings"));
                if (res.data.success && res.data.data?.settings) {
                    const apiSettings = res.data.data.settings;
                    setSettingsData({
                        application_name: apiSettings.application_name || "",
                        application_big_logo:
                            apiSettings.application_big_logo || "",
                    });
                }
            } catch (err) {
                console.error("Failed to fetch sidebar settings:", err);
            }
        };
        fetchSettings();
    }, []);

    // === Permissions ===
    const can = (perm) => auth?.permissions && auth.permissions.includes(perm);

    const navItems = [
        {
            icon: <FontAwesomeIcon icon={faTableColumns} />,
            name: "Dashboard",
            path: route("dashboard.view"),
            permission: "dashboard.view",
        },
        // {
        //     name: "Customers",
        //     icon: <FontAwesomeIcon icon={faUserTag} />,
        //     path: route("customer.index"),
        //     permission: "customer.index",
        // },
        {
            name: "Companies",
            icon: <FontAwesomeIcon icon={faUserTag} />,
            permission: "companies.index",
            subItems: [
                {
                    name: "Companies",
                    path: route("companies.index"),
                    permission: "companies.index",
                },
                {
                    name: "Offices",
                    path: route("companyOffice.index"),
                    permission: "companyOffice.index",
                },
                {
                    name: "Users",
                    path: route("companyUser.index"),
                    permission: "companyUser.index",
                },
            ],
        },
        {
            name: "Subscriptions",
            icon: <FontAwesomeIcon icon={faIdCardAlt} />,
            path: route("subscriptions.index"),
            permission: "subscriptions.index",
        },
        {
            name: "User and Roles",
            icon: <FontAwesomeIcon icon={faUserTag} />,
            subItems: [
                {
                    name: "Users",
                    path: route("user.list"),
                    permission: "user.list",
                },
                {
                    name: "Roles",
                    path: route("role.list"),
                    permission: "role.list",
                },
            ],
        },
        {
            name: "Support",
            icon: <FontAwesomeIcon icon={faHeadphones} />,
            subItems: [
                {
                    name: "FAQs",
                    path: route("support.faq.index"),
                    permission: "support.faq.index",
                },
                {
                    name: "Requests",
                    path: route("support.tickets.index"),
                    permission: "support.tickets.index",
                },
                {
                    name: "Comments",
                    path: route("support.chats.index"),
                    permission: "support.chats.index",
                },
            ],
        },
        {
            name: "Settings",
            icon: <FontAwesomeIcon icon={faUserGear} />,
            path: route("settings.index"),
            permission: "settings.index",
        },
    ];

    const isActive = (path) => {
        if (!path) return false;
        try {
            const pathName = new URL(path, window.location.origin).pathname;
            return url.startsWith(pathName);
        } catch {
            return url.startsWith(path);
        }
    };

    useEffect(() => {
        let submenuMatched = false;
        navItems.forEach((nav, index) => {
            nav.subItems?.forEach((subItem) => {
                if (isActive(subItem.path)) {
                    setOpenSubmenu({ type: "main", index });
                    submenuMatched = true;
                }
            });
        });
        if (!submenuMatched) setOpenSubmenu(null);
    }, [url]);

    useEffect(() => {
        if (openSubmenu !== null) {
            const key = `main-${openSubmenu.index}`;
            if (subMenuRefs.current[key]) {
                setSubMenuHeight((prev) => ({
                    ...prev,
                    [key]: subMenuRefs.current[key].scrollHeight || 0,
                }));
            }
        }
    }, [openSubmenu]);

    const handleSubmenuToggle = (index) => {
        setOpenSubmenu((prev) =>
            prev && prev.index === index ? null : { type: "main", index }
        );
    };

    const renderMenuItems = (items) => (
        <ul className="flex flex-col gap-4 site_bar">
            {items.map((nav, index) => {
                if (
                    nav.subItems &&
                    !nav.subItems.some((subItem) => can(subItem.permission))
                )
                    return null;
                if (nav.permission && !can(nav.permission)) return null;

                return (
                    <li key={nav.name}>
                        {nav.subItems ? (
                            <button
                                onClick={() => handleSubmenuToggle(index)}
                                className={`menu-item group ${
                                    openSubmenu?.index === index
                                        ? "menu-item-active"
                                        : "menu-item-inactive"
                                } cursor-pointer ${
                                    !isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "lg:justify-start"
                                }`}
                            >
                                <span
                                    className={`menu-item-icon-size ${
                                        openSubmenu?.index === index
                                            ? "menu-item-icon-active"
                                            : "menu-item-icon-inactive"
                                    }`}
                                >
                                    {nav.icon}
                                </span>
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <span className="menu-item-text">
                                        {nav.name}
                                    </span>
                                )}
                                {(isExpanded || isHovered || isMobileOpen) && (
                                    <FontAwesomeIcon
                                        icon={faChevronDown}
                                        className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                                            openSubmenu?.index === index
                                                ? "rotate-180 text-brand-500"
                                                : ""
                                        }`}
                                    />
                                )}
                            </button>
                        ) : (
                            nav.path && (
                                <Link
                                    href={nav.path}
                                    className={`menu-item group ${
                                        isActive(nav.path)
                                            ? "menu-item-active"
                                            : "menu-item-inactive"
                                    }`}
                                >
                                    <span
                                        className={`menu-item-icon-size ${
                                            isActive(nav.path)
                                                ? "menu-item-icon-active"
                                                : "menu-item-icon-inactive"
                                        }`}
                                    >
                                        {nav.icon}
                                    </span>
                                    {(isExpanded ||
                                        isHovered ||
                                        isMobileOpen) && (
                                        <span className="menu-item-text">
                                            {nav.name}
                                        </span>
                                    )}
                                </Link>
                            )
                        )}
                        {nav.subItems &&
                            (isExpanded || isHovered || isMobileOpen) && (
                                <div
                                    ref={(el) => {
                                        subMenuRefs.current[`main-${index}`] =
                                            el;
                                    }}
                                    className="overflow-hidden transition-all duration-300"
                                    style={{
                                        height:
                                            openSubmenu?.index === index
                                                ? `${
                                                      subMenuHeight[
                                                          `main-${index}`
                                                      ]
                                                  }px`
                                                : "0px",
                                    }}
                                >
                                    <ul className="mt-2 space-y-1 ml-9">
                                        {nav.subItems.map((subItem) =>
                                            !subItem.permission ||
                                            can(subItem.permission) ? (
                                                <li key={subItem.name}>
                                                    <Link
                                                        href={subItem.path}
                                                        className={`menu-dropdown-item ${
                                                            isActive(
                                                                subItem.path
                                                            )
                                                                ? "menu-dropdown-item-active"
                                                                : "menu-dropdown-item-inactive"
                                                        }`}
                                                    >
                                                        {subItem.name}
                                                    </Link>
                                                </li>
                                            ) : null
                                        )}
                                    </ul>
                                </div>
                            )}
                    </li>
                );
            })}
        </ul>
    );

    return (
        <aside
            className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
      ${
          isExpanded || isMobileOpen
              ? "w-[290px]"
              : isHovered
              ? "w-[290px]"
              : "w-[90px]"
      }
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      lg:translate-x-0`}
            onMouseEnter={() => !isExpanded && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* === LOGO AREA === */}
            <div
                className={`py-8 flex ${
                    !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "justify-start"
                }`}
            >
                <Link href={route("dashboard.view")}>
                    <img
                        src={
                            settingsData.application_big_logo
                                ? settingsData.application_big_logo.startsWith(
                                      "http"
                                  )
                                    ? settingsData.application_big_logo
                                    : `/${settingsData.application_big_logo.replace(
                                          /^\/+/,
                                          ""
                                      )}`
                                : "/default/logo.png"
                        }
                        alt={settingsData.application_name || "App Logo"}
                        className="transition-all duration-300 object-contain"
                        width={
                            isExpanded || isHovered || isMobileOpen ? 160 : 36
                        }
                        height={
                            isExpanded || isHovered || isMobileOpen ? 48 : 36
                        }
                    />
                </Link>
            </div>

            {/* === NAVIGATION === */}
            <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
                <nav className="mb-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2
                                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                                    !isExpanded && !isHovered
                                        ? "lg:justify-center"
                                        : "justify-start"
                                }`}
                            >
                                {isExpanded || isHovered || isMobileOpen ? (
                                    "Menu"
                                ) : (
                                    <span className="size-6" />
                                )}
                            </h2>
                            {renderMenuItems(navItems)}
                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
};

export default AppSidebar;
