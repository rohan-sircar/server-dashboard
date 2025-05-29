import React from "react";
import ServiceMonitorComponent from "./ServiceMonitorComponent";

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
  return (
    <ServiceMonitorComponent
      status={status}
      loading={loading}
      lastChecked={lastChecked}
      showToast={showToast}
      serviceName="alltalk-server"
      servicePath="alltalk-tts"
      displayName="AllTalk TTS Server"
    />
  );
};

export default AlltalkTtsServerMonitor;
