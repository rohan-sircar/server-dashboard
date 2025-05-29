import React from "react";
import ServiceMonitorComponent from "./ServiceMonitorComponent";

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
  return (
    <ServiceMonitorComponent
      status={status}
      loading={loading}
      lastChecked={lastChecked}
      showToast={showToast}
      serviceName="comfyui-server"
      servicePath="comfyui"
      displayName="ComfyUI Server"
    />
  );
};

export default ComfyuiServerMonitor;
