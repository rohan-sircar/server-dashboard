import React, { useState } from "react";
import MonitorComponent from "./MonitorComponent";
import ServiceLogViewer from "./ServiceLogViewer";

interface AlltalkTtsServerMonitorProps {
  status: string;
  loading: boolean;
  lastChecked: Date | null;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
}

const AlltalkTtsServerMonitor: React.FC<AlltalkTtsServerMonitorProps> = ({
  status,
  loading,
  lastChecked,
  showToast,
}) => {
  const [showAlltalkTtsServerLogs, setShowAlltalkTtsServerLogs] =
    useState(false);
  const handleStart = async () => {
    showToast("Starting AllTalk TTS Server...");
    try {
      await fetch("/api/service/alltalk-tts/start", { method: "POST" });
    } catch (error) {
      console.error("Failed to start AllTalk TTS server", error);
    }
  };

  const handleStop = async () => {
    showToast("Stopping AllTalk TTS Server...");
    try {
      await fetch("/api/service/alltalk-tts/stop", { method: "POST" });
    } catch (error) {
      console.error("Failed to stop AllTalk TTS server", error);
    }
  };

  return (
    <>
      <MonitorComponent
        status={status}
        loading={loading}
        lastChecked={lastChecked}
        serviceName="AllTalk TTS Server"
        onStart={handleStart}
        onStop={handleStop}
        onShowLogs={() => setShowAlltalkTtsServerLogs(true)}
      />
      {showAlltalkTtsServerLogs && (
        <ServiceLogViewer
          serviceName="alltalk-server"
          onClose={() => setShowAlltalkTtsServerLogs(false)}
        />
      )}
    </>
  );
};

export default AlltalkTtsServerMonitor;
