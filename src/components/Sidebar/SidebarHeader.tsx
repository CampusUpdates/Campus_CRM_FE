import { X } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

const SidebarHeader = () => {
  const { closeSidebar } = useSidebar();

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-5 lg:px-8 lg:py-6">
      <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-primary-800 dark:text-primary-400">
        Campus Updates
      </h1>
      <button
        type="button"
        onClick={closeSidebar}
        className="rounded-lg p-1.5 text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary transition cursor-pointer lg:hidden"
        title="Close sidebar"
        aria-label="Close sidebar"
      >
        <X size={20} />
      </button>
    </div>
  );
};

export default SidebarHeader;