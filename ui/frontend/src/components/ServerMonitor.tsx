import React from "react";
import MonitorComponent from "./MonitorComponent";

interface ServerMonitorProps {
  status: string;
  loading: boolean;
  lastChecked: Date | null;
  llmServerStatus: string;
  onShowLogs: () => void;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
}

const ServerMonitor: React.FC<ServerMonitorProps> = ({
  status,
  loading,
  lastChecked,
  llmServerStatus,
  onShowLogs,
  showToast,
}) => {
  const handleWake = async () => {
    showToast("Waking Server...");
    try {
      const res = await fetch("/api/wake", { method: "POST" });
      await res.json();
    } catch (error) {
      console.error("Failed to wake the server", error);
    }
  };

  const handleSuspend = async () => {
    showToast("Suspending Server...");
    try {
      await fetch("/api/suspend", {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to suspend the server", error);
    }
  };

  return (
    <div>
      <MonitorComponent
        status={status}
        loading={loading}
        lastChecked={lastChecked}
        serviceName="System"
        labelStart="Wake"
        onStart={handleWake}
        labelStop="Suspend"
        onStop={handleSuspend}
        onShowLogs={onShowLogs}
        stopDisabled={llmServerStatus === "online"}
      />
    </div>
  );
};

export default ServerMonitor;
