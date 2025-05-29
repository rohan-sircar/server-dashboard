import React from "react";
import { ClipLoader } from "react-spinners";
import TimeAgo from "react-timeago";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  PauseCircle as PauseCircleIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";

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
  gpuUsage?: number;
  memoryUsage?: number;
  uptime?: string;
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
  gpuUsage = 0,
  memoryUsage = 0,
  uptime = "0h 0m",
}) => {
  // Status icon based on status
  const getStatusIcon = () => {
    if (loading) {
      return <ClipLoader color="#4fc3f7" size={20} />;
    }

    switch (status) {
      case "online":
        return <CheckCircleIcon color="success" />;
      case "offline":
        return <CancelIcon color="error" />;
      case "warning":
        return <WarningIcon sx={{ color: "#ffab40" }} />;
      case "idle":
        return <PauseCircleIcon color="disabled" />;
      default:
        return <PauseCircleIcon color="disabled" />;
    }
  };

  // Status text color based on status
  const getStatusColor = () => {
    if (loading) return "text.secondary";

    switch (status) {
      case "online":
        return "success.main";
      case "offline":
        return "error.main";
      case "warning":
        return "#ffab40";
      case "idle":
        return "text.disabled";
      default:
        return "text.disabled";
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header: Service Name and Status */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box sx={{ mr: 1 }}>{getStatusIcon()}</Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {serviceName}
        </Typography>
        <Chip
          label={loading ? "CHECKING..." : status.toUpperCase()}
          size="small"
          sx={{
            color: "white",
            bgcolor: getStatusColor(),
            fontWeight: "bold",
          }}
        />
      </Box>

      {/* Last checked info */}
      {lastChecked && (
        <Typography
          variant="caption"
          className="last-checked"
          sx={{ display: "block", mb: 2 }}
        >
          Last checked <TimeAgo date={lastChecked} minPeriod={6} />
        </Typography>
      )}

      <Divider sx={{ my: 1.5 }} />

      {/* Middle: Key Metrics */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          my: 2,
        }}
      >
        {/* Uptime */}
        <Box sx={{ width: "30%" }}>
          <Typography
            variant="body2"
            color="text.secondary"
            className="metric-label"
          >
            Uptime
          </Typography>
          <Typography variant="body1" className="metric-value">
            {uptime}
          </Typography>
        </Box>

        {/* GPU Usage */}
        <Box sx={{ width: "30%" }}>
          <Typography
            variant="body2"
            color="text.secondary"
            className="metric-label"
          >
            GPU Usage
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ width: "100%", mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={gpuUsage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      gpuUsage > 80 ? "error.main" : "primary.main",
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              className="metric-value"
            >
              {`${Math.round(gpuUsage)}%`}
            </Typography>
          </Box>
        </Box>

        {/* Memory Usage */}
        <Box sx={{ width: "30%" }}>
          <Typography
            variant="body2"
            color="text.secondary"
            className="metric-label"
          >
            Memory
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ width: "100%", mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={memoryUsage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      memoryUsage > 80 ? "error.main" : "primary.main",
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              className="metric-value"
            >
              {`${Math.round(memoryUsage)}%`}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Bottom: Control Buttons */}
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onStart}
          disabled={startDisabled}
          startIcon={<PlayArrowIcon />}
          size="small"
          sx={{
            borderRadius: "20px",
            "&:hover": {
              backgroundColor: (theme) => theme.palette.primary.dark,
            },
          }}
        >
          {labelStart}
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={onStop}
          disabled={stopDisabled}
          startIcon={<StopIcon />}
          size="small"
          sx={{
            borderRadius: "20px",
            "&:hover": {
              backgroundColor: (theme) => theme.palette.error.dark,
              color: "white",
            },
          }}
        >
          {labelStop}
        </Button>
        <Button
          variant="outlined"
          onClick={onShowLogs}
          startIcon={<ArticleIcon />}
          size="small"
          sx={{
            borderRadius: "20px",
            "&:hover": {
              backgroundColor: (theme) => theme.palette.grey[800],
            },
          }}
        >
          Show Logs
        </Button>
      </Stack>
    </Box>
  );
};

export default MonitorComponent;
