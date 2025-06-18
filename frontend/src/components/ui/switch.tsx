"use client"

import React from "react";

interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  id,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
}) => {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
        checked ? "bg-slate-900" : "bg-slate-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export { Switch }; 