import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom"; // ⭐ REQUIRED FOR FIX
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisV,
  faEye,
  faPenToSquare,
  faFileAlt,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

export default function ApplicantsTable({ bookingId, onAction }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draw] = useState(1);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // ⭐ CHANGED: State for Portal Menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [activeRowData, setActiveRowData] = useState(null); // Stores the data of the row whose menu is open

  // ⭐ Bulk Selection State
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkRemarks, setBulkRemarks] = useState("");
  const dropdownRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    };

    // Close menu on scroll (prevents floating menu staying in place while table moves)
    const handleScroll = () => setOpenMenuId(null);

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); 

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    fetchApplicants();
  }, [bookingId, page, search]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);

      const start = (page - 1) * perPage;

      const url = window.route
        ? window.route("booking.applicants.list", bookingId)
        : `/booking/${bookingId}/applicants/list`;

      const response = await axios.get(url, {
        params: {
          draw,
          start,
          length: perPage,
          search: { value: search },
        },
      });

      const res = response.data;

      setData(res.data ?? res?.data?.data ?? []);
      setTotal(res.recordsTotal || res.total || 0);
    } catch (error) {
      console.error("Applicants fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / perPage);

  // ⭐ NEW: Toggle Menu with Position Calculation
  const toggleMenu = (e, row) => {
    e.stopPropagation();

    if (openMenuId === row.id) {
      setOpenMenuId(null);
      setActiveRowData(null);
    } else {
      // Get the position of the clicked button
      const rect = e.currentTarget.getBoundingClientRect();
      const menuWidth = 192; // Approx width of w-48 (12rem)
      const menuHeight = 160; // Approx height

      // Check if there is space below, otherwise flip up
      const spaceBelow = window.innerHeight - rect.bottom;
      const showTop = spaceBelow < menuHeight;

      setMenuPosition({
        top: showTop ? rect.top - menuHeight : rect.bottom + 5,
        left: rect.left - menuWidth + rect.width, // Align right edge
      });

      setActiveRowData(row);
      setOpenMenuId(row.id);
    }
  };

  const handleAction = (type, row) => {
    setOpenMenuId(null);
    onAction?.(type, row);
  };

  // ⭐ BULK SELECTION LOGIC
  const toggleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedRows.length === data.length) setSelectedRows([]);
    else setSelectedRows(data.map((d) => d.id));
  };

  return (
    <div className="border rounded-lg mt-4 shadow-sm bg-white">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-wrap justify-between items-center p-4 bg-gray-50 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Applicants List</h3>

        <input
          type="text"
          placeholder="Search applicants..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
        />
      </div>

      {/* ⭐ BULK ACTION BAR */}
      {selectedRows.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <span className="text-sm font-medium text-blue-800">
            {selectedRows.length} selected
          </span>

          <button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 shadow-sm transition"
          >
            Update Selected Status
          </button>
        </div>
      )}

      {/* ---------------- TABLE ---------------- */}
      <div className="overflow-x-auto min-h-[190px]">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedRows.length === data.length && data.length > 0}
                  onChange={selectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">UARN</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Office</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-8 text-gray-500 italic"
                >
                  Loading applicants...
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((row, idx) => {
                const formatStatus = (status) => {
                  if (!status) return "N/A";
                  const text = status.replace(/_/g, " ");
                  return text.charAt(0).toUpperCase() + text.slice(1);
                };

                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {/* SELECT BOX */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {(page - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {row.uarn || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{row.full_name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.company_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.office_name || "-"}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600">
                      {row.applicant_type}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize
      ${
        row.status === "attended"
          ? "bg-green-100 text-green-800"
          : row.status === "no_show"
          ? "bg-orange-100 text-orange-800"
          : row.status === "cancelled"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"
      }`}
                      >
                        {formatStatus(row.status)}

                        {row.report_status && (
                          <> - {formatStatus(row.report_status)}</>
                        )}
                      </span>
                    </td>

                    {/* ACTIONS - MODIFIED TO USE PORTAL TOGGLE */}
                    <td className="px-4 py-3 relative">
                      <button
                        type="button"
                        onClick={(e) => toggleMenu(e, row)} // ⭐ Passing Event and Row
                        className={`p-2 rounded-full transition ${
                          openMenuId === row.id 
                           ? "bg-gray-200 text-gray-800" 
                           : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <FontAwesomeIcon icon={faEllipsisV} />
                      </button>
                      
                      {/* ❌ DROPDOWN REMOVED FROM HERE - MOVED TO BOTTOM */}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-8 text-gray-500 italic"
                >
                  No applicants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- PAGINATION ---------------- */}
      <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50 text-sm text-gray-600">
        <span>
          Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)}{" "}
          of {total}
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className={`px-3 py-1 rounded border transition ${
              page <= 1
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          <span className="px-3 py-1 bg-white border rounded">Page {page}</span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={`px-3 py-1 rounded border transition ${
              page >= totalPages
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* ⭐ PORTAL DROPDOWN MENU - RENDERS OUTSIDE TABLE */}
      {openMenuId && activeRowData && createPortal(
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            top: menuPosition.top, 
            left: menuPosition.left,
            position: 'fixed' // Ensures it floats above everything
          }}
          className="z-[9999] w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1"
        >
          {/* VIEW */}
          <button
            type="button"
            onClick={() => handleAction("view", activeRowData)}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
          >
            <FontAwesomeIcon icon={faEye} className="text-blue-500 w-4" />
            View Details
          </button>

          {/* UPDATE STATUS */}
          <button
            type="button"
            onClick={() => handleAction("update_status", activeRowData)}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="text-green-500 w-4" />
            Update Status
          </button>

          {/* UPLOAD BILL */}
          {String(activeRowData.status || "").trim().toLowerCase() === "attended" ? (
            <button
              type="button"
              onClick={() => handleAction("upload_bill", activeRowData)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="text-indigo-500 w-4" />
              Upload Bill
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full text-left px-4 py-2 flex items-center gap-3 text-sm text-gray-400 cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="w-4" />
              Upload Bill
            </button>
          )}

          {/* UPLOAD REPORT */}
          {String(activeRowData.status || "").trim().toLowerCase() === "attended" ? (
            <button
              type="button"
              onClick={() => handleAction("upload_report", activeRowData)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700"
            >
              <FontAwesomeIcon icon={faFileAlt} className="text-indigo-500 w-4" />
              Upload Report
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full text-left px-4 py-2 flex items-center gap-3 text-sm text-gray-400 cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faFileAlt} className="w-4" />
              Upload Report
            </button>
          )}
        </div>,
        document.body // 👈 Attaches menu to the body tag
      )}

      {/* ⭐ BULK UPDATE MODAL */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Bulk Update Status
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Updating {selectedRows.length} selected applicants
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(false);
                  setSelectedRows([]);
                  setBulkStatus("");
                  setBulkRemarks("");
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select Status</option>
                  <option value="attended">Attended</option>
                  <option value="pending">Pending</option>
                  <option value="no_show">No Show</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Remarks
                </label>
                <textarea
                  value={bulkRemarks}
                  onChange={(e) => setBulkRemarks(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 mt-1 text-sm h-24 resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add remarks for all selected items..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-lg">
              <button
                type="button"
                onClick={() => {
                  setBulkModalOpen(false);
                  setSelectedRows([]);
                  setBulkStatus("");
                  setBulkRemarks("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!bulkStatus) {
                    toast.error("Please select a status before updating.");
                    return;
                  }

                  const payload = {
                    applicant_id: selectedRows,
                    status: bulkStatus,
                    status_remarks: bulkRemarks,
                  };

                  try {
                    const response = await axios.post(
                      window.route("booking.details.bulkUpdateStatus"),
                      payload
                    );

                    toast.success(
                      response.data.message || "Updated successfully!"
                    );

                    setBulkModalOpen(false);
                    setSelectedRows([]);
                    setBulkStatus("");
                    setBulkRemarks("");

                    fetchApplicants();
                  } catch (e) {
                    console.error("Bulk update failed:", e.response?.data || e);
                    toast.error(
                      e.response?.data?.message ||
                        "Something went wrong. Try again!"
                    );
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}