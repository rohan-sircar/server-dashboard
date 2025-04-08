import React, { useCallback, useEffect, useState } from "react";
import "./App.css";

interface Toast {
  message: string;
  type: "info" | "success" | "error";
}
import "./App.css";

interface Config {
  pollInterval: number;
  fastapiTimeout: number;
}

const App = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [config, setConfig] = useState<Config>();
  const [status, setStatus] = useState<string>("offline");

  // Fetch config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config");
        console.info("Get config", response);
        const data = await response.json();
        setConfig({
          pollInterval: parseInt(data.pollInterval) || 5000,
          fastapiTimeout: parseInt(data.fastapiTimeout) || 10000,
        });
      } catch (error) {
        console.error("Failed to fetch config", error);
        setConfig({
          pollInterval: 5000,
          fastapiTimeout: 10000,
        });
      }
    };

    fetchConfig();
  }, []);

  const showToast = (
    message: string,
    type: "info" | "success" | "error" = "info"
  ) => {
    setToasts((prev) => [...prev, { message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3000);
  };

  const ToastContainer = () => (
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

  // Function to poll the PC server's status through the local Node backend
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/hc");
      console.info("healthcheck result: ", res);
      const data = await res.json();
      setStatus(data.serverStatus || "offline");
    } catch (error) {
      console.error(error);
      setStatus("offline");
    }
  }, []);

  // Run immediately on window load
  window.addEventListener("load", checkStatus);

  useEffect(() => {
    // Set up polling interval
    if (config?.pollInterval) {
      const interval = setInterval(checkStatus, config.pollInterval);
      return () => {
        window.removeEventListener("load", checkStatus);
        clearInterval(interval);
      };
    }

    return () => window.removeEventListener("load", checkStatus);
  }, [checkStatus, config?.pollInterval]);

  // Function to call wake command through the local Node backend
  const handleWake = async () => {
    showToast("Waking Server...");
    try {
      const res = await fetch("/api/wake", { method: "POST" });
      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.error("Failed to wake the server", error);
    }
  };

  // Function to suspend the PC server using the FastAPI backend
  const handleSuspend = async () => {
    showToast("Suspending Server...");
    try {
      const res = await fetch("/api/suspend", {
        method: "POST",
      });
      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.error("Failed to suspend the server", error);
    }
  };

  return (
    <>
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>PC Server Monitor</h1>
        <div>
          <span
            style={{
              height: "20px",
              width: "20px",
              backgroundColor: status === "online" ? "green" : "grey",
              borderRadius: "50%",
              display: "inline-block",
              marginRight: "10px",
            }}
          />
          <span>{status.toUpperCase()}</span>
        </div>
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleWake}>Wake Server</button>
          <button onClick={handleSuspend} style={{ marginLeft: "20px" }}>
            Suspend Server
          </button>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default App;
