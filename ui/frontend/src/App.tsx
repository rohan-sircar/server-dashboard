/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import ServerMonitor from "./components/ServerMonitor";
import LlamaServerMonitor from "./components/LlamaServerMonitor";

interface Toast {
  message: string;
  type: "info" | "success" | "error";
}

interface Config {
  pollInterval: number;
  fastapiTimeout: number;
}

const App = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [config, setConfig] = useState<Config>();
  const [status, setStatus] = useState<string>("offline");
  const [prevStatus, setPrevStatus] = useState<string>("offline");
  const [llmServerStatus, setLlmServerStatus] = useState<string>("offline");
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Fetch config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        console.info("Loading config");
        const response = await fetch("/api/config");
        const data = await response.json();
        setConfig({
          pollInterval: parseInt(data.pollInterval) || 5000,
          fastapiTimeout: parseInt(data.fastapiTimeout) || 10000,
        });
      } catch (error) {
        console.error("Failed to fetch config", error);
        setConfig({
          pollInterval: 10000,
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
    setLoading(true);
    try {
      const res = await fetch("/hc");
      const data = await res.json();
      setStatus(data.serverStatus || "offline");
      setLlmServerStatus(data.llmServerStatus || "offline");
      setLastChecked(new Date());
    } catch (error) {
      console.error(error);
      setStatus("offline");
      setLlmServerStatus("offline");
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  // Run immediately on window load
  window.addEventListener("load", checkStatus);

  // Show toast on status change
  useEffect(() => {
    if (prevStatus !== status) {
      if (status === "online") {
        showToast("Server came online", "success");
      } else if (status === "offline") {
        showToast("Server went offline", "error");
      }
      setPrevStatus(status);
    }
  }, [status, prevStatus]);

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

  return (
    <>
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>PC Server Monitor</h1>
        <ServerMonitor
          status={status}
          loading={loading}
          lastChecked={lastChecked}
          llmServerStatus={llmServerStatus}
          onShowLogs={function (): void {
            throw new Error("Function not implemented.");
          }}
          showToast={showToast}
        />
        <LlamaServerMonitor
          status={llmServerStatus}
          loading={loading}
          lastChecked={lastChecked}
          showToast={showToast}
        />
      </div>
      <ToastContainer />
    </>
  );
};

export default App;
