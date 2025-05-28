/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer } from "./components/Toast";
import { Toast, createShowToast } from "./utils/toast";
import { useServerStatusToast } from "./hooks/useServerStatusToast";
import "./App.css";
import ServerMonitor from "./components/ServerMonitor";
import LlamaServerMonitor from "./components/LlamaServerMonitor";
import ComfyuiServerMonitor from "./components/ComfyuiServerMonitor";

interface Config {
  pollInterval: number;
  fastapiTimeout: number;
}

const App = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = createShowToast(setToasts);
  const [config, setConfig] = useState<Config>();
  const [status, setStatus] = useState<string>("offline");
  const [llmServerStatus, setLlmServerStatus] = useState<string>("offline");
  const [comfyuiServerStatus, setComfyuiServerStatus] =
    useState<string>("offline");
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

  // Function to poll the PC server's status through the local Node backend
  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/hc");
      const data = await res.json();
      setStatus(data.serverStatus || "offline");
      setLlmServerStatus(data.llmServerStatus || "offline");
      setComfyuiServerStatus(data.comfyuiServerStatus || "offline");
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

  useServerStatusToast(status, showToast);

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
        <ComfyuiServerMonitor
          status={comfyuiServerStatus}
          loading={loading}
          lastChecked={lastChecked}
          showToast={showToast}
        />
        <LlamaServerMonitor
          status={llmServerStatus}
          loading={loading}
          lastChecked={lastChecked}
          showToast={showToast}
        />
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
};

export default App;
