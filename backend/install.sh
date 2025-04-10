#!/bin/bash

# Create system user
sudo useradd --system -s /usr/sbin/nologin -d /opt/server-dashboard server-dashboard

# Copy application files
sudo cp -r requirements.txt /opt/server-dashboard
sudo cp -r app /opt/server-dashboard

sudo su - server-dashboard 
/usr/bin/python3 -m venv /opt/server-dashboard/env
source /opt/server-dashboard/env/bin/activate
pip install -r requirements.txt
exit

# Set ownership
sudo chown -R server-dashboard:users /opt/server-dashboard

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
sudo systemctl enable --now server-dashboard
sleep 2
sudo systemctl status server-dashboard