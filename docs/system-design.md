Below is the updated design document and implementation plan based on your feedback to use FastAPI for the Python backend and TypeScript for the React frontend.

---

# Design Document: Remote PC Monitoring and Control Dashboard

## Goals

- Monitor the status of a PC LLM server remotely.
- Use a low-power SBC (Rock64) as a jumpbox/dashboard to manage power consumption.
- Provide a user interface (web UI) to wake the PC server via Wake-on-LAN (WOL) and put it to sleep (suspend) when not in use.
- Save power on the PC by suspending it during idle periods.

## High-Level Architecture

1. **Backend API Service (on the PC Server):**

   - Developed in Python using FastAPI.
   - Runs as a daemon that listens for HTTP requests.
   - Exposes endpoints to:
     - Return the current status of the server (e.g., GET /api/hc).
     - Suspend the server (e.g., POST /api/suspend) by executing `sudo systemctl suspend`.
   - Uses a dedicated user with restricted sudo permissions (e.g., passwordless sudo for `systemctl suspend`).

2. **Frontend Web Dashboard (on the Rock64 SBC):**

   - Developed as a React application using TypeScript.
   - A Node.js server (with Express or similar) can be used if needed to serve the app and handle local system commands (such as executing `etherwake` for waking the PC).
   - The dashboard displays:
     - A status icon: green if the PC server is online, grey if it is unreachable/off.
     - A "Wake" button: sends a command (e.g., via a local Node.js endpoint) to wake the PC using WOL.
     - A "Suspend" button: calls the FastAPI backend endpoint on the PC server to suspend it.

3. **Network and Security Considerations:**
   - Ensure the Rock64 and the PC server are on the same network or are properly routable.
   - Secure communications by limiting exposure (firewalls, VPNs) and considering HTTPS if exposed externally.
   - Use dedicated users with minimal sudo permissions and potentially token-based authentication for API endpoints.

---

## Detailed Components

### A. FastAPI Backend on the PC Server

- **Endpoints:**

  - `GET /api/hc`: Returns a JSON indicating that the PC is online.  
    Example response: `{ "status": "online" }`
  - `POST /api/suspend`: Attempts to suspend the server by calling `sudo systemctl suspend` via a system subprocess.

- **Sudoers Configuration:**

  - Create a dedicated user (e.g., `serverctrl`).
  - Configure the sudoers file to permit this user to run the suspend command without a password. For example:

    ```
    serverctrl ALL=(root) NOPASSWD: /bin/systemctl suspend
    ```

- **Implementation with FastAPI (Python Example):**

  ```python
  # backend_api.py
  import subprocess
  from fastapi import FastAPI, HTTPException
  from fastapi.responses import JSONResponse

  app = FastAPI()

  @app.get("/api/hc")
  async def health_check():
      # Basic health check response. More sophisticated checks can be added if needed.
      return {"status": "online"}

  @app.post("/api/suspend")
  async def suspend():
      try:
          # Execute the suspend command
          subprocess.run(["sudo", "systemctl", "suspend"], check=True)
          return JSONResponse(status_code=200, content={"status": "suspending"})
      except subprocess.CalledProcessError as e:
          raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

  if __name__ == '__main__':
      import uvicorn
      uvicorn.run(app, host="0.0.0.0", port=8000)
  ```

- **Running the API:**
  - Use uvicorn for development.
  - For production, consider using Gunicorn with uvicorn workers behind a reverse proxy (Nginx).

### B. React Frontend Dashboard with TypeScript on the Rock64 SBC

- **Application Overview:**

  - Developed with React and TypeScript.
  - Contains components for displaying the server status, and buttons to trigger wake and suspend operations.
  - May utilize a local Node.js/Express server to execute system commands (like `etherwake`) securely.

- **Frontend Functionality:**

  - **StatusIndicator Component:**  
    Displays a green or grey indicator depending on whether the PC server is online.  
    It polls the FastAPI endpoint (GET /api/hc) at a fixed interval (e.g., every 5 seconds).

  - **WakeButton Component:**  
    On click, sends a request to an endpoint (e.g., POST /api/wake on the local Node.js server) that executes `sudo /usr/sbin/etherwake <MAC_ADDRESS>`.

  - **SuspendButton Component:**  
    Sends a POST request to `/api/suspend` on the FastAPI backend of the PC server.

- **Sudoers Configuration on the Rock64 for Wake Operation:**

  - Create a dedicated user or adjust permissions so that the command to wake the server (e.g., using `etherwake`) can run without a password.
  - Example sudoers entry:

    ```
    rock64ctrl ALL=(root) NOPASSWD: /usr/sbin/etherwake
    ```

- **Example Node.js/Express Server to Handle Wake Command (Optional):**

  ```typescript
  // server.ts (Node.js server using Express and TypeScript)
  import express from "express";
  import { exec } from "child_process";
  import path from "path";

  const app = express();
  const PORT = 3000;
  const MAC_ADDRESS = "XX:XX:XX:XX:XX:XX"; // Replace with your PC server's MAC address

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "build"))); // Serve the static React build

  app.post("/api/wake", (req, res) => {
    exec(`sudo /usr/sbin/etherwake ${MAC_ADDRESS}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing etherwake: ${error}`);
        return res.status(500).send({ error: "Failed to wake the server" });
      }
      res.send({ status: "waking", stdout });
    });
  });

  app.listen(PORT, () => {
    console.log(`Node server listening on port ${PORT}`);
  });
  ```

- **React App (TypeScript) Sample Component (App.tsx):**

  ```tsx
  // App.tsx
  import React, { useEffect, useState } from "react";

  const PC_API_BASE = "http://<PC_SERVER_IP>:8000/api"; // Replace <PC_SERVER_IP> with actual IP address

  const App: React.FC = () => {
    const [status, setStatus] = useState<string>("offline");

    // Function to poll the PC server's status
    const checkStatus = async () => {
      try {
        const res = await fetch(`${PC_API_BASE}/hc`);
        if (res.ok) {
          setStatus("online");
        } else {
          setStatus("offline");
        }
      } catch (error) {
        setStatus("offline");
      }
    };

    useEffect(() => {
      const interval = setInterval(checkStatus, 5000);
      return () => clearInterval(interval);
    }, []);

    // Function to call wake command through the local Node backend
    const handleWake = async () => {
      try {
        const res = await fetch("/api/wake", { method: "POST" });
        const data = await res.json();
        console.log(data);
      } catch (error) {
        console.error("Failed to wake the server", error);
      }
    };

    // Function to suspend the PC server using the FastAPI backend
    const handleSuspend = async () => {
      try {
        const res = await fetch(`${PC_API_BASE}/suspend`, { method: "POST" });
        const data = await res.json();
        console.log(data);
      } catch (error) {
        console.error("Failed to suspend the server", error);
      }
    };

    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>PC Server Monitor</h1>
        <div>
          <span
            style={{
              height: "20px",
              width: "20px",
              backgroundColor: status === "online" ? "green" : "grey",
              borderRadius: "50%",
              display: "inline-block",
              marginRight: "10px",
            }}
          />
          <span>{status.toUpperCase()}</span>
        </div>
        <div style={{ marginTop: "20px" }}>
          <button onClick={handleWake}>Wake Server</button>
          <button onClick={handleSuspend} style={{ marginLeft: "20px" }}>
            Suspend Server
          </button>
        </div>
      </div>
    );
  };

  export default App;
  ```

- **Project Setup Recommendations:**
  - Use Create React App with the TypeScript template or Vite for the React + TypeScript project.
  - If using a Node.js server, compile the TypeScript (using ts-node or by compiling to JavaScript) and ensure the static build of the React app is served correctly.
  - Use environment variables or configuration files to manage API endpoint URLs and the target MAC address.

---

## Implementation Steps

1. **Backend (PC Server with FastAPI):**

   - Set up a Python virtual environment.
   - Install FastAPI and uvicorn (`pip install fastapi uvicorn`).
   - Create the FastAPI API (`backend_api.py`) with the `/api/hc` and `/api/suspend` endpoints.
   - Configure the sudoers file for the dedicated user to allow executing `systemctl suspend` without a password.
   - Test the FastAPI endpoints locally using uvicorn.

2. **Frontend (Rock64 SBC with React & TypeScript):**

   - Initialize a React project with TypeScript (using Create React App or Vite).
   - Develop the UI components (StatusIndicator, WakeButton, SuspendButton) as shown above.
   - (Optional) Set up a Node.js server with Express (using TypeScript) to handle the wake command by executing `etherwake`.
   - Configure the sudoers file on the Rock64 to allow passwordless execution of the wake command via `etherwake`.
   - Develop appropriate error handling and loading states in your React components.

3. **Integration & Testing:**

   - Ensure the Rock64 dashboard can reach the FastAPI backend on the PC server.
   - Test the wake functionality via the local Node.js endpoint and the suspend functionality via FastAPI.
   - Verify proper state updates on the dashboard (online/offline status) and handle error cases gracefully.

4. **Security Enhancements:**

   - Limit network exposure to only the necessary IP ranges.
   - Consider HTTPS for production deployments.
   - Optional: Add authentication tokens to API endpoints to restrict access.

5. **Deployment:**
   - Deploy the FastAPI backend with a production server (e.g., Gunicorn with uvicorn workers behind Nginx).
   - Serve the React build (and optional Node.js server) on the Rock64 using a process manager like PM2.
   - Monitor logs and set up automatic restarts as needed.

---

## Suggestions and Improvements

- Use HTTPS and secure authentication if your network isn’t completely isolated.
- Log activity on both the FastAPI and Node.js servers for auditing and troubleshooting.
- Improve user experience by incorporating confirmation dialogs (especially before suspending the server).
- Document configuration (like server IP addresses, MAC addresses, and port numbers) using environment variables or configuration files.
- Consider graceful degradation or offline states in the UI if the PC server cannot be reached.

---

This document should give you a clear roadmap using FastAPI for the backend and a TypeScript-based React frontend, with the respective security and implementation considerations. Feel free to adjust details based on your network specifics and personal setup.
