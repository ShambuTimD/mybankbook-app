import React, { useEffect, useState, useRef, useMemo } from "react";
import ComponentCard from "@/Components/common/ComponentCard";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faTicket,
    faSpinner,
    faArrowLeft,
    faRotateRight,
    faDownload,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Head, router } from "@inertiajs/react";
import Header from "@/Pages/BrandSelfAppointment/Header";
import Footer from "@/Pages/BrandSelfAppointment/Footer";
import UserConversation from "./UserConversation"; // Ensure this path is correct based on where you save the file

dayjs.extend(relativeTime);
DataTable.use(DT);

function SupportTicketHistory() {
    // --- VIEW STATES ---
    const [view, setView] = useState("list");

    // --- DATA STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- FILTER STATE ---
    const [filterOffice, setFilterOffice] = useState("all");

    // --- HEADER & FOOTER DATA STATES ---
    const [companyData, setCompanyData] = useState(null);
    const [settings, setSettings] = useState({});

    // --- DETAIL VIEW STATES ---
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketMessages, setTicketMessages] = useState([]);

    const tableRef = useRef(null);
    const userData = JSON.parse(sessionStorage.getItem("session_user") || "{}");
    const token = userData?.token;

    // --- LOAD HEADER DATA & OFFICES ---
    useEffect(() => {
        const savedUser = sessionStorage.getItem("session_user");
        const savedCompany = sessionStorage.getItem("session_company");
        const selectedOfficeName = sessionStorage.getItem(
            "korpheal_selected_office_name"
        );

        if (savedUser && savedCompany) {
            try {
                const parsedUser = JSON.parse(savedUser);
                const parsedCompany = JSON.parse(savedCompany);
                const constructedData = {
                    company_name: parsedCompany.company_name,
                    logo: parsedCompany.logo || "",
                    offices: parsedCompany.offices || [],
                    display_center:
                        selectedOfficeName ||
                        parsedCompany.offices?.[0]?.office_name ||
                        "",
                    hr_details: {
                        name: parsedUser.first_name || "HR Team",
                        email: parsedUser.email,
                        profile_image: "",
                        empid: `${parsedUser.id}`,
                        designation: parsedUser.role_title || "HR Admin",
                        role_name: parsedUser.role_name,
                    },
                };
                setCompanyData(constructedData);
            } catch (e) {
                console.error("Error parsing session data:", e);
            }
        }

        // Fetch Settings
        axios.get(route("frontend.settings")).then((res) => {
            if (res.data.success) setSettings(res.data.data.settings);
        });
    }, []);

    // --- FETCH TICKETS ---
    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                route("frontend.support.tickets.list"),
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setTickets(res.data?.data || []);
        } catch (e) {
            toast.error("Failed to load tickets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // --- FETCH DETAIL ---
    const fetchTicketDetails = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(
                route("frontend.support.tickets.view", id),
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.data.success) {
                const ticketData = res.data.data.ticket || res.data.data;
                const msgData = res.data.data.messages || [];

                setSelectedTicket(ticketData);
                setTicketMessages(msgData);
                setView("detail");
            } else {
                toast.error(res.data.message || "Could not load ticket.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to load ticket details.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditTicket = (id) => {
        router.visit(route('frontend.conversation.view', id));
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // --- FILTERING LOGIC ---
    const filteredTickets = useMemo(() => {
        return tickets.filter((t) => {
            const officeName = t.office?.office_name || "-";
            const matchOffice =
                filterOffice === "all" || officeName === filterOffice;

            const s = searchTerm.toLowerCase();
            const matchSearch =
                (t.subject || "").toLowerCase().includes(s) ||
                (t.ticket_id || "").toLowerCase().includes(s) ||
                (t.category || "").toLowerCase().includes(s) ||
                (t.priority || "").toLowerCase().includes(s);

            return matchOffice && matchSearch;
        });
    }, [tickets, filterOffice, searchTerm]);

    // --- EXPORT FUNCTION ---
    const handleExport = (type = "csv") => {
        try {
            if (!filteredTickets.length) {
                toast.error("No records to export.");
                return;
            }

            const exportRows = filteredTickets.map((row) => ({
                "Ticket ID": row.ticket_id,
                Subject: row.subject,
                Office: row.office || row.office_name || "-",
                Status: row.status || "-",
                "Created On": row.created_at
                    ? dayjs(row.created_at).format("DD-MM-YYYY hh:mm A")
                    : "-",
            }));

            const header = Object.keys(exportRows[0]).join(",");
            const rows = exportRows
                .map((row) =>
                    Object.values(row)
                        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                        .join(",")
                )
                .join("\n");

            const csvContent = header + "\n" + rows;
            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `support_tickets_${dayjs().format(
                "YYYY-MM-DD"
            )}.${type}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export successful!");
        } catch (err) {
            console.error(err);
            toast.error("Export failed.");
        }
    };

    // --- DATATABLE COLUMNS ---
    const columns = [
        { data: "ticket_id", title: "Ticket ID" },
        { data: "subject", title: "Subject" },
        {
            data: "attachment",
            title: "Upload",
            orderable: false,
            searchable: false,
            width: "80px",
            render: (data) => {
                // If the data is empty or null, show a dash
                if (!data)
                    return '<span class="text-gray-300 text-xs">-</span>';

                // ✅ The backend now sends the FULL URL, so we just use 'data' directly
                const url = data;

                // Check extension for image vs file
                const isImg = url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i);

                if (isImg) {
                    return `
                        <a href="${url}" target="_blank" class="block w-12 h-12 rounded-lg border border-gray-200 overflow-hidden hover:opacity-80 transition bg-white shadow-sm">
                            <img src="${url}" alt="Attachment" class="w-full h-full object-cover" />
                        </a>
                    `;
                }

                // Fallback for non-image files (PDF, etc.)
                return `
                    <a href="${url}" target="_blank" class="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition shadow-sm" title="View Attachment">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    </a>
                `;
            },
        },
        {
            data: null,
            title: "Office",
            render: (row) => {
                return row.office?.office_name || "-";
            },
        },
        {
            data: "created_at",
            title: "Created On",
            render: (value) =>
                value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "-",
        },
        {
            data: "status",
            title: "Status",
            render: (v) => {
                const map = {
                    Open: "bg-red-100 text-red-700",
                    "In Progress": "bg-yellow-100 text-yellow-700",
                    Resolved: "bg-green-100 text-green-700",
                    Closed: "bg-gray-200 text-gray-700",
                };
                const cls = map[v] || "bg-gray-100 text-gray-700";
                return `<span class="px-2 py-1 rounded-full text-xs font-normal ${cls}">${v}</span>`;
            },
        },
        {
            data: null,
            title: "Action",
            orderable: false,
            searchable: false,
            render: (row) => `
        <div class="action-wrapper relative">
            <button class="action-btn px-2 py-1 text-gray-700 text-lg hover:text-blue-600 transition">
                <svg class="svg-inline--fa fa-ellipsis-v" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="ellipsis-v" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" data-fa-i2svg=""><path fill="currentColor" d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z"></path></svg>
            </button>
            <div class="action-menu hidden absolute right-0 mt-1 w-36 bg-white shadow-xl rounded-lg border border-gray-100 z-[9999]">
                <div class="edit-item px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700" data-id="${row.id}">
                    View / Reply
                </div>
            </div>
        </div>
    `,
        },
    ];

    // --- ACTION MENU LISTENER ---
    useEffect(() => {
        const onClick = (e) => {
            if (e.target.closest(".action-btn")) {
                const wrapper = e.target.closest(".action-wrapper");
                const menu = wrapper.querySelector(".action-menu");
                document.querySelectorAll(".action-menu").forEach((m) => {
                    if (m !== menu) m.classList.add("hidden");
                });
                menu.classList.toggle("hidden");
                e.stopPropagation();
            } else {
                document
                    .querySelectorAll(".action-menu")
                    .forEach((m) => m.classList.add("hidden"));
            }

            if (e.target.closest(".edit-item")) {
                const id = e.target.closest(".edit-item").dataset.id;
                if (id) handleEditTicket(id);
            }
        };

        if (view === "list") {
            document.addEventListener("click", onClick);
        }
        return () => document.removeEventListener("click", onClick);
    }, [view, tickets]);

    useEffect(() => {
        document.body.style.overflow = "auto";

        const style = document.createElement("style");
        style.innerHTML = `
        html, body { overflow-y: auto !important; }
        .dataTables_scrollBody { overflow-y: auto !important; }
        .action-menu { overflow-y: auto !important; }
    `;
        document.head.appendChild(style);

        return () => (document.body.style.overflow = "auto");
    }, []);

    const handleBackToList = () => {
        setView("list");
        fetchTickets();
        router.replace("/f/support/history");
    };

    // =========================================
    // RENDER: HISTORY PAGE MAIN LAYOUT
    // =========================================
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            <Head title="Support Ticket History" />

            <Header
                authenticated={true}
                settings={settings}
                companyData={companyData}
                currentStep={0}
                steps={[]}
                isDashboardView={false}
            />

            <main className="flex-1 p-6 w-full">
                {/* LIST VIEW */}
                {view === "list" && (
                    <ComponentCard className="relative !p-0 !pt-3 !pb-3 shadow-md">
                        {/* PAGE HEADING & BACK BUTTON */}
                        <div className="relative flex items-center w-full mb-12 pt-8">
                            {/* CENTERED ICON + TITLE */}
                            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 mt-4">
                                <div className="bg-indigo-100 text-indigo-600 w-16 h-16 flex items-center justify-center rounded-full text-2xl shadow-sm">
                                    <FontAwesomeIcon icon={faTicket} />
                                </div>

                                <h2 className="text-2xl md:text-3xl font-normal text-gray-900 text-center">
                                    Support Ticket History
                                </h2>
                            </div>

                            {/* BACK BUTTON RIGHT */}
                            <button
                                onClick={() => router.visit("/f/support")}
                                className="ml-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center shadow-sm"
                            >
                                <FontAwesomeIcon
                                    icon={faArrowLeft}
                                    className="mr-2"
                                />
                                Back
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-10">
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                    className="text-3xl text-indigo-600"
                                />
                                <p className="text-gray-500 mt-2">
                                    Loading tickets...
                                </p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto px-4 pb-4">
                                <div className="mb-5 flex flex-wrap justify-between items-end border-b pb-3 gap-4">
                                    {/* LEFT FILTERS */}
                                    <div className="flex flex-wrap gap-6 items-end">
                                        <div className="flex flex-col min-w-[250px]">
                                            <label className="text-sm font-normal text-gray-800 mb-1">
                                                Filter by Office
                                            </label>
                                            <select
                                                value={filterOffice}
                                                onChange={(e) =>
                                                    setFilterOffice(
                                                        e.target.value
                                                    )
                                                }
                                                className="border rounded-md px-3 py-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="all">
                                                    All Offices
                                                </option>
                                                {companyData?.offices?.map(
                                                    (office, index) => (
                                                        <option
                                                            key={
                                                                office.id ||
                                                                index
                                                            } // Uses index if ID is missing
                                                            value={
                                                                office.office_name
                                                            }
                                                        >
                                                            {office.office_name}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    {/* RIGHT ACTIONS */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={fetchTickets}
                                            className="flex items-center gap-2 border rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 bg-white shadow-sm"
                                        >
                                            <FontAwesomeIcon
                                                icon={faRotateRight}
                                                className="text-gray-600 text-lg"
                                            />
                                            <span>Refresh</span>
                                        </button>

                                        {/* 🔥 EXPORT BUTTON */}
                                        <div className="inline-flex items-center border rounded-md bg-white hover:bg-gray-50 cursor-pointer shadow-sm">
                                            <FontAwesomeIcon
                                                icon={faDownload}
                                                className="text-gray-600 ml-3 mr-2 text-sm"
                                            />
                                            <select
                                                defaultValue=""
                                                onChange={(e) => {
                                                    if (e.target.value)
                                                        handleExport(
                                                            e.target.value
                                                        );
                                                    e.target.value = "";
                                                }}
                                                className="bg-transparent border-none outline-none px-2 pr-[35px] py-2 text-sm cursor-pointer appearance-none font-medium text-gray-700"
                                            >
                                                <option value="">Export</option>
                                                <option value="csv">CSV</option>
                                                <option value="xlsx">
                                                    Excel
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="dt-wrapper-relative mt-4 overflow-visible relative z-[10]">
                                    <div className="dt-custom-search-box">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FontAwesomeIcon
                                                    icon={faSearch}
                                                    className="text-gray-400"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 transition-shadow bg-white"
                                            />
                                        </div>
                                    </div>

                                    <DataTable
                                        ref={tableRef}
                                        data={filteredTickets}
                                        columns={columns}
                                        className="display w-full font-normal text-gray-800"
                                        options={{
                                            responsive: true,
                                            paging: true,
                                            searching: true,
                                            info: true,
                                            ordering: false,
                                            dom: 'lrt<"flex items-center justify-between px-4 py-3 border-t"ip>',
                                            language: {
                                                emptyTable: "No tickets found",
                                            },
                                            createdRow: (row, data) => {
                                                row.setAttribute(
                                                    "data-id",
                                                    data.id
                                                );
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </ComponentCard>
                )}

                {/* DETAIL VIEW */}
                {view === "detail" && selectedTicket && (
                    <UserConversation
                        selectedTicket={selectedTicket}
                        ticketMessages={ticketMessages}
                        onBack={handleBackToList}
                        onRefresh={fetchTicketDetails}
                        token={token}
                        userData={userData}
                    />
                )}
            </main>

            <Footer
                companyName={settings?.company_name || "Corporate Wellness"}
            />
        </div>
    );
}
SupportTicketHistory.layout = null;
export default SupportTicketHistory;