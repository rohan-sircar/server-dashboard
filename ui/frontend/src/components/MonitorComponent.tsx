import React from "react";
import { ClipLoader } from "react-spinners";
import TimeAgo from "react-timeago";

interface MonitorComponentProps {
  status: string;
  loading: boolean;
  lastChecked: Date | null;
  serviceName: string;
  labelStart?: string;
  onStart: () => void;
  labelStop?: string;
  onStop: () => void;
  onShowLogs: () => void;
  stopDisabled?: boolean;
  startDisabled?: boolean;
}

const MonitorComponent: React.FC<MonitorComponentProps> = ({
  status,
  loading,
  lastChecked,
  serviceName,
  labelStart = "Start",
  onStart,
  labelStop = "Stop",
  onStop,
  onShowLogs,
  stopDisabled = false,
  startDisabled = false,
}) => {
  return (
    <div style={{ marginTop: "20px" }}>
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
        {serviceName}: {loading ? "CHECKING..." : status.toUpperCase()}
        {lastChecked && (
          <span style={{ marginLeft: "8px", color: "#666", fontSize: "0.9em" }}>
            (Last checked <TimeAgo date={lastChecked} minPeriod={6} />)
          </span>
        )}
      </span>
      <div style={{ marginTop: "10px" }}>
        <button onClick={onStart} disabled={startDisabled}>
          {labelStart}
        </button>
        <button
          onClick={onStop}
          style={{ marginLeft: "20px" }}
          disabled={stopDisabled}
        >
          {labelStop}
        </button>
        <button onClick={onShowLogs} style={{ marginLeft: "20px" }}>
          Show Logs
        </button>
      </div>
    </div>
  );
};

export default MonitorComponent;
