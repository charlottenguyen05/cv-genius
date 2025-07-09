"use client";
import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose?: () => void;
}

const typeStyles: Record<string, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500 text-black",
  info: "bg-blue-500",
};

export const TOAST_DURATION = 5000;

const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  duration = TOAST_DURATION,
  onClose,
}) => {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setHidden(true);
    if (onClose) onClose();
  };

  if (hidden) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 ${typeStyles[type]} text-white px-6 py-3 rounded shadow-lg z-50 animate-fade-in flex items-center justify-between`}
      role="alert"
    >
      <span>{message}</span>
      <button
        onClick={handleClose}
        className="ml-4 text-white font-bold focus:outline-none"
        aria-label="Close"
        type="button"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;
