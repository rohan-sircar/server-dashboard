import React, { useEffect, useState } from "react";

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
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/logs/${serviceName}`);

    eventSource.onmessage = (event) => {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, event.data];
        // Keep only the last maxLines logs
        return newLogs.slice(-maxLines);
      });
    };

    eventSource.onerror = () => {
      console.error("SSE connection error");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [serviceName, maxLines]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Logs for {serviceName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 flex-1">
          <pre className="text-sm font-mono">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ServiceLogViewer;
