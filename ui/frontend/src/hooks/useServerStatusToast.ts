import { useEffect, useState } from "react";

export const useServerStatusToast = (
  status: string,
  showToast: (message: string, type: "info" | "success" | "error") => void
) => {
  const [prevStatus, setPrevStatus] = useState(status);

  useEffect(() => {
    if (prevStatus !== status) {
      if (status === "online") {
        showToast("Server came online", "success");
      } else if (status === "offline") {
        showToast("Server went offline", "error");
      }
      setPrevStatus(status);
    }
  }, [status, prevStatus, showToast]);
};
