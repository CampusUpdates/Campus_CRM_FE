import SidebarHeader from "./SidebarHeader";
import SidebarMenu from "./SidebarMenu";

const Sidebar = () => {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-border bg-white">
      <SidebarHeader />
      <SidebarMenu />
    </aside>
  );
};

export default Sidebar;