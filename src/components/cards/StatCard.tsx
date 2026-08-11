import Card from "./Card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
}: StatCardProps) => {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-semibold text-text-primary">
            {value}
          </h2>

          <p className="mt-2 text-xs text-text-muted">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-12 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon
            size={22}
            className={iconColor}
            strokeWidth={2}
          />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;