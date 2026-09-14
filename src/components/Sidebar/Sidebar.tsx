import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";

const Sidebar = () => {
  return (
    <aside className="flex h-screen w-80 shrink-0 flex-col border-r border-border bg-sidebar">
      <SidebarHeader />
      <SidebarMenu />
    </aside>
  );
};

export default Sidebar;