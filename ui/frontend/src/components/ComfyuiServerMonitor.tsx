import React, { useState } from "react";
import MonitorComponent from "./MonitorComponent";
import ServiceLogViewer from "./ServiceLogViewer";

interface ComfyuiServerMonitorProps {
  status: string;
  loading: boolean;
  lastChecked: Date | null;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
}

const ComfyuiServerMonitor: React.FC<ComfyuiServerMonitorProps> = ({
  status,
  loading,
  lastChecked,
  showToast,
}) => {
  const [showComfyuiServerLogs, setShowComfyuiServerLogs] = useState(false);
  const handleStart = async () => {
    showToast("Starting ComfyUI Server...");
    try {
      await fetch("/api/service/comfyui/start", { method: "POST" });
    } catch (error) {
      console.error("Failed to start ComfyUI server", error);
    }
  };

  const handleStop = async () => {
    showToast("Stopping ComfyUI Server...");
    try {
      await fetch("/api/service/comfyui/stop", { method: "POST" });
    } catch (error) {
      console.error("Failed to stop ComfyUI server", error);
    }
  };

  return (
    <>
      <MonitorComponent
        status={status}
        loading={loading}
        lastChecked={lastChecked}
        serviceName="ComfyUI Server"
        onStart={handleStart}
        onStop={handleStop}
        onShowLogs={() => setShowComfyuiServerLogs(true)}
      />
      {showComfyuiServerLogs && (
        <ServiceLogViewer
          serviceName="comfyui-server"
          onClose={() => setShowComfyuiServerLogs(false)}
        />
      )}
    </>
  );
};

export default ComfyuiServerMonitor;
