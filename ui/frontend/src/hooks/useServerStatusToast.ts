import { useEffect, useState } from "react";

export const useStatusToast = (
  status: string,
  name: string,
  showToast: (message: string, type: "info" | "success" | "error") => void
) => {
  const [prevStatus, setPrevStatus] = useState(status);

  useEffect(() => {
    if (prevStatus !== status) {
      if (status === "online") {
        showToast(`${name} came online`, "success");
      } else if (status === "offline") {
        showToast(`${name} went offline`, "error");
      }
      setPrevStatus(status);
    }
  }, [status, prevStatus, showToast, name]);
};
