import { SidebarProvider, useSidebar } from "../Context/SidebarContext";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { usePage } from "@inertiajs/react";
import React from "react";
import { toast } from "react-hot-toast";

const LayoutContent = ({ children }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { toast: toastData } = usePage().props;

  React.useEffect(() => {
    if (toastData?.message) {
      toast[toastData.type || 'success'](toastData.message);
    }
  }, [toastData]);


  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all overflow-x-auto duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">
          {children} {/* ✅ This replaces <Outlet /> */}
        </div>
      </div>
    </div>
  );
};

const AppLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent> {/* ✅ Inject page */}
    </SidebarProvider>
  );
};

export default AppLayout;
