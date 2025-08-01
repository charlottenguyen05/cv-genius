import React from "react";
import { Trash2, X } from "lucide-react";

interface DeleteButtonProps {
  onClick: () => void;
  variant?: "trash" | "x";
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  onClick,
  variant = "trash",
  size = "md",
  className = "",
  ariaLabel = "Supprimer",
}) => {
  const IconComponent = variant === "trash" ? Trash2 : X;
  
  const sizeClasses = {
    sm: { padding: "p-1", icon: "h-3 w-3" },
    md: { padding: "p-2", icon: "h-4 w-4" },
    lg: { padding: "p-2", icon: "h-5 w-5" }
  };

  const sizeClass = sizeClasses[size];
  const padding = sizeClass.padding;
  const iconDimensions = sizeClass.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${padding} text-red-500 hover:text-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded-full hover:bg-red-50 ${className}`}
      aria-label={ariaLabel}
    >
      <IconComponent className={iconDimensions} />
    </button>
  );
};

export default DeleteButton; 