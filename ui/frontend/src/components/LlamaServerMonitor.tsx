import React, { useState } from "react";
import MonitorComponent from "./MonitorComponent";
import ServiceLogViewer from "./ServiceLogViewer";

interface LlamaServerMonitorProps {
  status: string;
  loading: boolean;
  lastChecked: Date | null;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
}

const LlamaServerMonitor: React.FC<LlamaServerMonitorProps> = ({
  status,
  loading,
  lastChecked,
  showToast,
}) => {
  const [showLlamaServerLogs, setShowLlamaServerLogs] = useState(false);
  const handleStart = async () => {
    showToast("Starting LLM Server...");
    try {
      await fetch("/api/llm/start", { method: "POST" });
    } catch (error) {
      console.error("Failed to start LLM server", error);
    }
  };

  const handleStop = async () => {
    showToast("Stopping LLM Server...");
    try {
      await fetch("/api/llm/stop", { method: "POST" });
    } catch (error) {
      console.error("Failed to stop LLM server", error);
    }
  };

  return (
    <>
      <MonitorComponent
        status={status}
        loading={loading}
        lastChecked={lastChecked}
        serviceName="LLM Server"
        onStart={handleStart}
        onStop={handleStop}
        onShowLogs={() => setShowLlamaServerLogs(true)}
      />
      {showLlamaServerLogs && (
        <ServiceLogViewer
          serviceName="llama.cpp-server"
          onClose={() => setShowLlamaServerLogs(false)}
        />
      )}
    </>
  );
};

export default LlamaServerMonitor;
