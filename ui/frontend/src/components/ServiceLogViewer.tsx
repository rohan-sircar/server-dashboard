import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { LazyLog, ScrollFollow } from "@melloware/react-logviewer";
// import "react-log-viewer/dist/index.css";

// Set the app element for accessibility
Modal.setAppElement("#root");

interface ServiceLogViewerProps {
  serviceName: string;
  maxLines?: number;
  onClose: () => void;
}

const ServiceLogViewer: React.FC<ServiceLogViewerProps> = ({
  serviceName,
  maxLines = 500,
  onClose,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      contentLabel={`${serviceName} Logs`}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        content: {
          position: "relative",
          width: "90vw",
          height: "90vh",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: 0,
          border: "none",
          borderRadius: "8px",
          background: "#1e1e1e",
          overflow: "hidden",
          inset: "auto",
        },
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header - Fixed at the top */}
        <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700 sticky top-0 z-10">
          <h2 className="text-white text-lg font-semibold">
            {serviceName} Logs
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoScroll((prev) => !prev)}
              className={`px-3 py-1 rounded text-sm ${
                autoScroll
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              {autoScroll ? "Auto-scroll: On" : "Auto-scroll: Off"}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div style={{ height: "80vh", width: "100%" }}>
          <ScrollFollow
            startFollowing={true}
            render={({ onScroll }) => (
              <LazyLog
                follow={autoScroll}
                url={`/api/logs/${serviceName}`}
                onScroll={onScroll}
                lineHeight={21}
                enableSearch
                selectableLines
                extraLines={1}
                style={{
                  backgroundColor: "#1e1e1e",
                  color: "#d4d4d4",
                }}
                formatPart={(text) => {
                  // Custom formatting for different log levels
                  if (text.includes("ERROR") || text.includes("FATAL")) {
                    return <span style={{ color: "#f56c6c" }}>{text}</span>;
                  }
                  if (text.includes("WARN")) {
                    return <span style={{ color: "#e6a23c" }}>{text}</span>;
                  }
                  if (text.includes("INFO")) {
                    return <span style={{ color: "#67c23a" }}>{text}</span>;
                  }
                  return text;
                }}
                stream
              />
            )}
          />
        </div>

        {/* Footer with stats 
        <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between items-center sticky bottom-0 z-10">
          <div className="text-gray-400 text-sm">
            {logs.length} {logs.length === 1 ? "line" : "lines"}
            {maxLines && logs.length === maxLines && ` (max ${maxLines})`}
          </div>
          {!autoScroll && (
            <button
              onClick={() => setAutoScroll(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              <span>Scroll to Bottom</span>
            </button>
          )}
        </div>*/}
      </div>
    </Modal>
  );
};

export default ServiceLogViewer;
