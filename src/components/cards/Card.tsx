import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = ({ children, className = "" }: CardProps) => {
  return (
    <div
      className={`
        rounded-xl
        border
        border-border
        bg-surface
        shadow-sm
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;