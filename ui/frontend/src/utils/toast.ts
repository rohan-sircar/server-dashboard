import React from "react";

export interface Toast {
  message: string;
  type: "info" | "success" | "error";
}

export const createShowToast =
  (setToasts: React.Dispatch<React.SetStateAction<Toast[]>>) =>
  (message: string, type: "info" | "success" | "error" = "info") => {
    setToasts((prev) => [...prev, { message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };
