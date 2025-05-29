import { Box, Card, CardContent } from "@mui/material";
import React from "react";

interface MonitorCardProps {
  children: React.ReactNode;
  width?: { xs: string; md: string };
}

const MonitorCard: React.FC<MonitorCardProps> = ({
  children,
  width = { xs: "100%", md: "48%" },
}) => {
  return (
    <Box sx={{ width }}>
      <Card
        className="monitor-card"
        sx={{
          background: "linear-gradient(to bottom right, #1e1e1e, #2a2a2a)",
          boxShadow: 3,
          borderRadius: 2,
          "&:hover": {
            boxShadow: 6,
          },
        }}
      >
        <CardContent>{children}</CardContent>
      </Card>
    </Box>
  );
};

export default MonitorCard;
