import React from "react";
import { Toast } from "../utils/toast";

export const ToastContainer = ({ toasts }: { toasts: Toast[] }) => (
  <div
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      zIndex: 1000,
    }}
  >
    {toasts.map((toast, index) => (
      <div
        key={index}
        style={{
          padding: "12px 24px",
          marginBottom: "10px",
          borderRadius: "4px",
          color: "white",
          backgroundColor:
            toast.type === "error"
              ? "#ff4444"
              : toast.type === "success"
              ? "#00C851"
              : "#33b5e5",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        {toast.message}
      </div>
    ))}
  </div>
);
