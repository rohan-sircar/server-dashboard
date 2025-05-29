import React from "react";
import ServiceMonitorComponent from "./ServiceMonitorComponent";

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
  return (
    <ServiceMonitorComponent
      status={status}
      loading={loading}
      lastChecked={lastChecked}
      showToast={showToast}
      serviceName="llama.cpp-server"
      servicePath="llm"
      displayName="LLM Server"
    />
  );
};

export default LlamaServerMonitor;
