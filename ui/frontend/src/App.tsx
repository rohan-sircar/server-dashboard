/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import ServiceLogViewer from "./components/ServiceLogViewer";
import { ClipLoader } from "react-spinners";
import TimeAgo from "react-timeago";
import "./App.css";

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
  const [showLogs, setShowLogs] = useState(false);
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

  // Function to call wake command through the local Node backend
  const handleWake = async () => {
    showToast("Waking Server...");
    try {
      const res = await fetch("/api/wake", { method: "POST" });
      const data = await res.json();
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
    } catch (error) {
      console.error("Failed to suspend the server", error);
    }
  };

  const handleLlmStart = async () => {
    showToast("Starting LLM Server...");
    try {
      const res = await fetch("/api/llm/start", { method: "POST" });
      const data = await res.json();
    } catch (error) {
      console.error("Failed to start LLM server", error);
    }
  };

  const handleLlmStop = async () => {
    showToast("Stopping LLM Server...");
    try {
      const res = await fetch("/api/llm/stop", { method: "POST" });
      const data = await res.json();
    } catch (error) {
      console.error("Failed to stop LLM server", error);
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
              backgroundColor: loading
                ? "transparent"
                : status === "online"
                ? "green"
                : "grey",
              borderRadius: "50%",
              display: "inline-block",
              marginRight: "10px",
            }}
          >
            {loading && (
              <ClipLoader
                color="#36d7b7"
                size={20}
                cssOverride={{ display: "inline-block" }}
              />
            )}
          </span>
          <span>
            {loading ? "CHECKING..." : status.toUpperCase()}
            {lastChecked && (
              <span
                style={{ marginLeft: "8px", color: "#666", fontSize: "0.9em" }}
              >
                (Last checked <TimeAgo date={lastChecked} minPeriod={6} />)
              </span>
            )}
          </span>
        </div>
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleWake}>Wake Server</button>
          <button
            onClick={handleSuspend}
            style={{ marginLeft: "20px" }}
            disabled={llmServerStatus === "online"}
          >
            Suspend Server
          </button>
        </div>
        <div style={{ marginTop: "20px" }}>
          <span
            style={{
              height: "20px",
              width: "20px",
              backgroundColor: loading
                ? "transparent"
                : llmServerStatus === "online"
                ? "green"
                : "grey",
              borderRadius: "50%",
              display: "inline-block",
              marginRight: "10px",
            }}
          >
            {loading && (
              <ClipLoader
                color="#36d7b7"
                size={20}
                cssOverride={{ display: "inline-block" }}
              />
            )}
          </span>
          <span>
            LLM Server:{" "}
            {loading ? "CHECKING..." : llmServerStatus.toUpperCase()}
            {lastChecked && (
              <span
                style={{ marginLeft: "8px", color: "#666", fontSize: "0.9em" }}
              >
                (Last checked <TimeAgo date={lastChecked} minPeriod={6} />)
              </span>
            )}
          </span>
        </div>
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleLlmStart}>Start LLM Server</button>
          <button
            onClick={handleLlmStop}
            style={{ marginLeft: "20px" }}
            // disabled={llmServerStatus === "offline"}
          >
            Stop LLM Server
          </button>
          <button
            onClick={() => setShowLogs(true)}
            style={{ marginLeft: "20px" }}
          >
            Show Logs
          </button>
        </div>
      </div>
      {showLogs && (
          <ServiceLogViewer
            serviceName="llama.cpp-server"
            onClose={() => setShowLogs(false)}
          />
      )}
      <ToastContainer />
    </>
  );
};

export default App;
