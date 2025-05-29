/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import { ToastContainer } from "./components/Toast";
import { Toast, createShowToast } from "./utils/toast";
import { useStatusToast } from "./hooks/useServerStatusToast";
import "./App.css";
import ServerMonitor from "./components/ServerMonitor";
import LlamaServerMonitor from "./components/LlamaServerMonitor";
import ComfyuiServerMonitor from "./components/ComfyuiServerMonitor";
import AlltalkTtsServerMonitor from "./components/AlltalkTtsServerMonitor";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Card,
  CardContent,
  Box,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PauseCircle as PauseCircleIcon,
} from "@mui/icons-material";

// Create dark theme with accent color
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4fc3f7", // Vibrant blue accent color
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
  },
  typography: {
    fontFamily: "Roboto, Open Sans, sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 500,
    },
  },
});

interface Config {
  pollInterval: number;
  fastapiTimeout: number;
}

const App = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = createShowToast(setToasts);
  const [config, setConfig] = useState<Config>();
  const [status, setStatus] = useState<string>("offline");
  const [llmServerStatus, setLlmServerStatus] = useState<string>("offline");
  const [comfyuiServerStatus, setComfyuiServerStatus] =
    useState<string>("offline");
  const [alltalkTtsServerStatus, setAlltalkTtsServerStatus] =
    useState<string>("offline");
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Fetch config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        console.info("Loading config");
        const response = await fetch("/api/config");
        const data = await response.json();
        setConfig({
          pollInterval: parseInt(data.pollInterval) || 5000,
          fastapiTimeout: parseInt(data.fastapiTimeout) || 10000,
        });
      } catch (error) {
        console.error("Failed to fetch config", error);
        setConfig({
          pollInterval: 10000,
          fastapiTimeout: 10000,
        });
      }
    };

    fetchConfig();
  }, []);

  // Function to poll the PC server's status through the local Node backend
  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/hc");
      const data = await res.json();
      setStatus(data.serverStatus || "offline");
      setLlmServerStatus(data.llmServerStatus || "offline");
      setComfyuiServerStatus(data.comfyuiServerStatus || "offline");
      setAlltalkTtsServerStatus(data.alltalkTtsServerStatus || "offline");
      setLastChecked(new Date());
    } catch (error) {
      console.error(error);
      setStatus("offline");
      setLlmServerStatus("offline");
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  // Run immediately on window load
  window.addEventListener("load", checkStatus);

  useStatusToast(status, "Server", showToast);
  useStatusToast(llmServerStatus, "LLM Server", showToast);
  useStatusToast(comfyuiServerStatus, "ComfyUI Server", showToast);
  useStatusToast(alltalkTtsServerStatus, "AllTalk TTS Server", showToast);

  useEffect(() => {
    // Set up polling interval
    if (config?.pollInterval) {
      const interval = setInterval(checkStatus, config.pollInterval);
      return () => {
        window.removeEventListener("load", checkStatus);
        clearInterval(interval);
      };
    }

    return () => window.removeEventListener("load", checkStatus);
  }, [checkStatus, config?.pollInterval]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h1" align="center" gutterBottom>
          AI Server Monitor
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "48%" } }}>
            <Card
              className="monitor-card"
              sx={{
                background:
                  "linear-gradient(to bottom right, #1e1e1e, #2a2a2a)",
                boxShadow: 3,
                borderRadius: 2,
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <ServerMonitor
                  status={status}
                  loading={loading}
                  lastChecked={lastChecked}
                  llmServerStatus={llmServerStatus}
                  onShowLogs={function (): void {
                    throw new Error("Function not implemented.");
                  }}
                  showToast={showToast}
                />
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: "100%", md: "48%" } }}>
            <Card
              className="monitor-card"
              sx={{
                background:
                  "linear-gradient(to bottom right, #1e1e1e, #2a2a2a)",
                boxShadow: 3,
                borderRadius: 2,
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <AlltalkTtsServerMonitor
                  status={alltalkTtsServerStatus}
                  loading={loading}
                  lastChecked={lastChecked}
                  showToast={showToast}
                />
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: "100%", md: "48%" } }}>
            <Card
              className="monitor-card"
              sx={{
                background:
                  "linear-gradient(to bottom right, #1e1e1e, #2a2a2a)",
                boxShadow: 3,
                borderRadius: 2,
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <ComfyuiServerMonitor
                  status={comfyuiServerStatus}
                  loading={loading}
                  lastChecked={lastChecked}
                  showToast={showToast}
                />
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ width: { xs: "100%", md: "48%" } }}>
            <Card
              className="monitor-card"
              sx={{
                background:
                  "linear-gradient(to bottom right, #1e1e1e, #2a2a2a)",
                boxShadow: 3,
                borderRadius: 2,
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <LlamaServerMonitor
                  status={llmServerStatus}
                  loading={loading}
                  lastChecked={lastChecked}
                  showToast={showToast}
                />
              </CardContent>
            </Card>
          </Box>
        </Box>

        <ToastContainer toasts={toasts} />
      </Container>
    </ThemeProvider>
  );
};

export default App;
