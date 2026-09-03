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
        border-border
        hover:border-primary-500
        hover:bg-neutral-100
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
          bg-primary-50
          text-primary-600
          flex
          items-center
          justify-center
          group-hover:bg-primary-600
          group-hover:text-white
          transition-colors
        "
      >
        <Icon size={20} />
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-semibold text-text-primary">
          {title}
        </h4>

        {description && (
          <p className="text-xs text-text-secondary mt-1">
            {description}
          </p>
        )}
      </div>
    </button>
  );
};

export default ActionButton;