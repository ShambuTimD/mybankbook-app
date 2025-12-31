// resources/js/Pages/Admin/Reports/Components/RemarksModal.jsx
import React from "react";

const RemarksModal = ({ open, remarksText, onClose }) => {
  if (!open) return null;

  return (
<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-5 py-3 border-b bg-blue-50 flex items-center justify-between rounded-t-xl">
          <h3 className="text-lg font-semibold text-blue-800">Status Remarks</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="p-5 text-sm text-gray-700 leading-relaxed">
          {remarksText || "No remarks available."}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50 text-right rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemarksModal;
