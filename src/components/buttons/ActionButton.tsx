import type { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
}

const ActionButton = ({
  title,
  description,
  icon: Icon,
  onClick,
}: ActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="
        w-full
        flex
        items-center
        gap-4
        p-4
        rounded-xl
        border
        border-slate-200
        hover:border-indigo-500
        hover:bg-indigo-50
        transition-all
        duration-200
        text-left
        group
      "
    >
      <div
        className="
          w-11
          h-11
          rounded-lg
          bg-indigo-100
          text-indigo-600
          flex
          items-center
          justify-center
          group-hover:bg-indigo-600
          group-hover:text-white
          transition-colors
        "
      >
        <Icon size={20} />
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-800">
          {title}
        </h4>

        {description && (
          <p className="text-xs text-slate-500 mt-1">
            {description}
          </p>
        )}
      </div>
    </button>
  );
};

export default ActionButton;