#!/bin/bash

# Create and configure installation directory
sudo mkdir -p /opt/server-dashboard

# Copy application files
sudo cp -r requirements.txt /opt/server-dashboard
sudo cp -r app /opt/server-dashboard


# Create system user
sudo useradd -r -s /bin/false -m -d /opt/server-dashboard server-dashboard

# Set ownership
sudo chown -R server-dashboard:server-dashboard /opt/server-dashboard

# Configure sudoers
echo "server-dashboard ALL=(root) NOPASSWD: /bin/systemctl suspend" | sudo tee /etc/sudoers.d/server-dashboard

# Create systemd service
sudo tee /etc/systemd/system/server-dashboard.service <<EOL
[Unit]
Description=Server Dashboard API
After=network.target

[Service]
User=server-dashboard
Group=server-dashboard
WorkingDirectory=/opt/server-dashboard
ExecStart=/opt/server-dashboard/env/bin/uvicorn app.api:app --host 0.0.0.0 --port 8050
Restart=always

[Install]
WantedBy=multi-user.target
EOL



# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable server-dashboard
sudo systemctl start server-dashboard