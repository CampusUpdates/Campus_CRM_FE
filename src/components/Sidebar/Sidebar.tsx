import { useEffect } from "react";
import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";
import { useSidebar } from "../../context/SidebarContext";

const Sidebar = () => {
  const { isSidebarOpen, closeSidebar } = useSidebar();

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    const isLg = window.matchMedia("(min-width: 1024px)").matches;
    if (!isLg) {
      document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <>
      {/* Mobile & Tablet Drawer Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-2xs lg:hidden animate-in fade-in duration-200"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-full w-[min(280px,85vw)] shrink-0 flex-col overflow-hidden
          border-r border-border bg-sidebar shadow-2xl transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:h-screen lg:w-72 lg:max-w-none lg:shadow-none lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <SidebarHeader />
        <SidebarMenu />
      </aside>
    </>
  );
};

export default Sidebar;