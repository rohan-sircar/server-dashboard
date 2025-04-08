import express from "express";
import { exec } from "child_process";
import path from "path";

const app = express();
const HOST = process.env.SD_NODE_HOST || "localhost";
const PORT = parseInt(process.env.SD_NODE_PORT || "3000");
const MAC_ADDRESS = process.env.SD_TARGET_MAC || "XX:XX:XX:XX:XX:XX";
const FASTAPI_URL = process.env.SD_FASTAPI_URL || "http://rohan-desktop:8085";
const FASTAPI_TIMEOUT = parseInt(process.env.SD_FASTAPI_TIMEOUT || "10000");
const POLL_INTERVAL = parseInt(process.env.SD_POLL_INTERVAL || "5000");

app.use(express.json());

// Serve static files only if not in development
if (process.env.NODE_ENV !== "development") {
  app.use(express.static(path.join(__dirname, "./frontend/dist")));
}

app.get("/hc", async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT);

    const response = await fetch(`${FASTAPI_URL}/hc`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.info("Server is online");
    const data = await response.json();
    res.send({ status: "ok", serverStatus: data.status });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.debug("Server status check timed out");
      res.status(200).send({ status: "ok", serverStatus: "offline" });
    } else {
      console.error("Failed to check server status:", error);
      res
        .status(500)
        .send({ status: "error", message: "Failed to check server status" });
    }
  }
});

app.get("/api/config", (req, res) => {
  res.send({
    serverUrl: FASTAPI_URL,
    pollInterval: POLL_INTERVAL,
    fastapiTimeout: FASTAPI_TIMEOUT,
  });
});

app.post("/api/wake", (req, res) => {
  exec(`sudo /usr/sbin/etherwake ${MAC_ADDRESS}`, (error, stdout) => {
    if (error) {
      console.error(`Error executing etherwake: ${error}`);
      return res.status(500).send({ error: "Failed to wake the server" });
    }
    res.send({ status: "waking", stdout });
  });
});

app.post("/api/suspend", async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT);

    const response = await fetch(`${FASTAPI_URL}/api/suspend`, {
      method: "POST",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    res.send(data);
  } catch (error) {
    console.error("Failed to suspend the server:", error);
    res.status(500).send({ error: "Failed to suspend the server" });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Node server listening on http://${HOST}:${PORT}`);
});
