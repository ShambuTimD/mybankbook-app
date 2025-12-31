import React, { useEffect } from "react";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import PageBreadcrumb from "@/Components/common/PageBreadCrumb";
import ComponentCard from "@/Components/common/ComponentCard";
import ActionMenu from "@/Components/ui/Action";
import { router, Head } from "@inertiajs/react";
import toast from "react-hot-toast";

DataTable.use(DT);

function Companies({ title = "Company" }) {
  useEffect(() => {
    toast.success(`${title} list loaded successfully!`);
  }, [title]);

  const columns = [
    { data: "id", title: "Sys Id", orderable: false, searchable: false },
    { data: "name", title: "Company Name" },
    { data: "email", title: "Email" },
    {
      data: "logo",
      title: "Logo",
      render: (data) => {
        if (!data) return "-";
        const fullPath = data.startsWith("http") ? data : `/storage/${data}`;
        return `<img src="${fullPath}" alt="Logo" style="height:40px;border-radius:4px;object-fit:contain" />`;
      },
      orderable: false,
      searchable: false,
    },
    {
      data: "status",
      title: "Status",
      render: (data, type, row) => {
        const checked = data === "active" ? "checked" : "";
        // add data-current to avoid optimistic UI flutters
        return `
          <label class="switch">
            <input type="checkbox" class="status-toggle" data-id="${row.id}" data-current="${data}" ${checked}>
            <span class="slider round"></span>
          </label>
        `;
      },
      orderable: false,
      searchable: false,
    },
    {
      data: "action",
      name: "action",
      title: "Action",
      orderable: false,
      searchable: false,
    },
  ];

  // ✅ Single, safe, confirmed toggle handler with cleanup
  useEffect(() => {
    const tableEl = document.querySelector(".display");
    if (!tableEl) return;

    const tokenEl = document.querySelector('meta[name="csrf-token"]');
    const csrf = tokenEl?.getAttribute("content") || "";
    const pending = new Set(); // prevent double clicks per id

    const onChange = async (e) => {
      const target = e.target;
      if (!(target && target.classList && target.classList.contains("status-toggle"))) return;

      const id = target.dataset.id;
      if (!id || pending.has(id)) return;

      // derive the intended next state from the visual toggle
      const willBeActive = target.checked;
      const next = willBeActive ? "active" : "inactive";
      const current = target.dataset.current || (willBeActive ? "inactive" : "active");

      // ask for confirmation
      const ok = window.confirm(`Are you sure you want to set status to "${next}"?`);
      if (!ok) {
        // revert visual state immediately
        target.checked = current === "active";
        return;
      }

      try {
        pending.add(id);
        // lock the UI during request
        target.disabled = true;

        const res = await fetch(route("companies.toggle-status", id), {
          method: "PATCH",
          headers: {
            "X-CSRF-TOKEN": csrf,
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
          },
          credentials: "same-origin",
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data?.success) {
          // reflect authoritative state from server
          const isActive = data.status === "active";
          target.checked = isActive;
          target.dataset.current = data.status;
          toast.success(`Status updated to ${data.status}`);
        } else {
          // revert on failure
          target.checked = current === "active";
          toast.error("Failed to update status.");
        }
      } catch (err) {
        // revert on error
        target.checked = current === "active";
        toast.error("Error updating status.");
        console.error(err);
      } finally {
        pending.delete(id);
        target.disabled = false;
      }
    };

    // Ensure we don't attach multiple times
    tableEl.addEventListener("change", onChange);
    return () => {
      tableEl.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <div>
      <Head title={`${title} List`} />
      <PageBreadcrumb pageTitle={`${title} List`} />
      <ComponentCard url={route("companies.create")} urlText={`Create ${title}`} icon={null}>
        <DataTable
          ajax={route("companies.list")}
          columns={columns}
          className="display"
          options={{
            responsive: true,
            select: true,
            serverSide: true,
            processing: true,
            order: [[0, "desc"]],
          }}
          slots={{
            action: (cellData, rowData) => (
              <ActionMenu
                onEdit={() => router.visit(route("companies.edit", rowData.id))}
                onDelete={() => {
                  if (confirm("Are you sure you want to delete this company?")) {
                    router.delete(route("companies.destroy", rowData.id));
                  }
                }}
              />
            ),
          }}
        />
      </ComponentCard>

      <style>{`
        .switch{position:relative;display:inline-block;width:40px;height:20px}
        .switch input{opacity:0;width:0;height:0}
        .slider{position:absolute;cursor:pointer;background:#ccc;transition:.4s;border-radius:20px;inset:0}
        .slider:before{position:absolute;content:"";height:14px;width:14px;left:3px;bottom:3px;background:#fff;transition:.4s;border-radius:50%}
        input:checked + .slider{background:#4caf50}
        input:checked + .slider:before{transform:translateX(20px)}
      `}</style>
    </div>
  );
}

export default Companies;
