import React, { useState } from "react";
import MonitorComponent from "./MonitorComponent";
import ServiceLogViewer from "./ServiceLogViewer";

interface ServiceMonitorComponentProps {
  status: string;
  loading: boolean;
  lastChecked: Date | null;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
  serviceName: string;
  servicePath: string;
  displayName: string;
}

const ServiceMonitorComponent: React.FC<ServiceMonitorComponentProps> = ({
  status,
  loading,
  lastChecked,
  showToast,
  serviceName,
  servicePath,
  displayName,
}) => {
  const [showLogs, setShowLogs] = useState(false);

  const handleStart = async () => {
    showToast(`Starting ${displayName}...`);
    try {
      await fetch(`/api/service/${servicePath}/start`, { method: "POST" });
    } catch (error) {
      console.error(`Failed to start ${displayName}`, error);
    }
  };

  const handleStop = async () => {
    showToast(`Stopping ${displayName}...`);
    try {
      await fetch(`/api/service/${servicePath}/stop`, { method: "POST" });
    } catch (error) {
      console.error(`Failed to stop ${displayName}`, error);
    }
  };

  return (
    <>
      <MonitorComponent
        status={status}
        loading={loading}
        lastChecked={lastChecked}
        serviceName={displayName}
        onStart={handleStart}
        onStop={handleStop}
        onShowLogs={() => setShowLogs(true)}
      />
      {showLogs && (
        <ServiceLogViewer
          serviceName={serviceName}
          onClose={() => setShowLogs(false)}
        />
      )}
    </>
  );
};

export default ServiceMonitorComponent;
