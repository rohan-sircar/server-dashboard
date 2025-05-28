import express from "express";
import { exec } from "child_process";
import path from "path";

const app = express();
const HOST = process.env.SD_NODE_HOST || "localhost";
const PORT = parseInt(process.env.SD_NODE_PORT || "3000");
const MAC_ADDRESS = process.env.SD_TARGET_MAC || "XX:XX:XX:XX:XX:XX";
const FASTAPI_URL = process.env.SD_FASTAPI_URL || "http://localhost:8080";
const FASTAPI_TIMEOUT = parseInt(process.env.SD_FASTAPI_TIMEOUT || "10000");
const POLL_INTERVAL = parseInt(process.env.SD_POLL_INTERVAL || "10000");

// Track the current server state
let currentServerState: "online" | "offline" | null = null;

console.info("FastAPI URL: ", FASTAPI_URL);

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

    const data = await response.json();
    const newState = "online";

    // Log only if the state has changed
    if (currentServerState !== newState) {
      console.info("FastApi Server became online");
      currentServerState = newState;
    }
    res.send({
      status: "ok",
      serverStatus: data.status,
      llmServerStatus: data.llmServerStatus,
      comfyuiServerStatus: data.comfyuiServerStatus || "offline",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const newState = "offline";

      // Log only if the state has changed
      if (currentServerState !== newState) {
        console.debug("FastApi Server went offline");
        currentServerState = newState;
      }

      res.status(200).send({ status: "ok", serverStatus: "offline" });
    } else {
      if (currentServerState !== "offline") {
        console.error("Failed to check server status:", error);
      }
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
  console.info("Attempting to wake server with MAC address:", MAC_ADDRESS);
  exec(`sudo /usr/sbin/etherwake ${MAC_ADDRESS}`, (error, stdout) => {
    if (error) {
      console.error(`Error executing etherwake: ${error}`);
      return res.status(500).send({ error: "Failed to wake the server" });
    }
    res.send({ status: "waking", stdout });
  });
});

app.post("/api/suspend", async (req, res) => {
  console.info("Attempting to suspend server at:", FASTAPI_URL);
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

// Unified service control endpoint
app.post("/api/service/:serviceName/:action", async (req, res) => {
  const { serviceName, action } = req.params;

  // Validate action
  const validActions = ["start", "stop", "status"];
  if (!validActions.includes(action)) {
    res.status(400).send({ error: "Invalid action" });
    return;
  }

  // Validate service
  const validServices = ["llm", "comfyui", "alltalk-tts", "alltalk-finetune"];
  if (!validServices.includes(serviceName)) {
    res.status(400).send({ error: "Invalid service" });
    return;
  }

  console.info(
    `Attempting to ${action} ${serviceName} server at:`,
    FASTAPI_URL
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT);

    const method = action === "status" ? "GET" : "POST";
    const response = await fetch(
      `${FASTAPI_URL}/api/service/${serviceName}/${action}`,
      {
        method,
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to ${action} the ${serviceName} server:`, error);
    res
      .status(500)
      .send({ error: `Failed to ${action} the ${serviceName} server` });
    return;
  }
});

// TODO rename to /api/logs/service_name
// Log streaming endpoint
app.get("/api/logs/:serviceName", async (req, res) => {
  const { serviceName } = req.params;

  try {
    // Forward to FastAPI backend
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FASTAPI_TIMEOUT);

    const response = await fetch(`${FASTAPI_URL}/logs/${serviceName}`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Stream the response to client
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }

    // Handle client disconnect
    req.on("close", () => {
      controller.abort();
    });
  } catch (error) {
    console.error("Log streaming error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream logs" });
    }
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Node server listening on http://${HOST}:${PORT}`);
});
