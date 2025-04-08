# Client UI Implementation Plan

## 1. Express Server Setup

### Configuration Management

- Use environment variables for sensitive/changeable settings
- Required configuration:
  - `FASTAPI_URL`: Base URL of FastAPI backend (e.g. `http://192.168.1.100:8000`)
  - `TARGET_MAC`: MAC address for WOL (e.g. `00:1A:2B:3C:4D:5E`)
  - `POLL_INTERVAL`: Health check frequency in ms (default: `5000`)
- Create `.env.template` file with example values
- Implement configuration validation in Express startup

### API Routes

1. **Configuration Endpoint**
   - Route: `/api/config`
   - Method: GET
   - Returns safe configuration values to frontend
   - Example response:
     ```json
     {
       "pollInterval": 5000,
       "allowMacEdit": false
     }
     ```

## 2. React UI Development

### Configuration Context

- Create React context for app configuration
- Types:
  ```typescript
  interface AppConfig {
    apiBaseUrl: string;
    pollInterval: number;
    allowMacEdit: boolean;
    macAddress?: string;
  }
  ```
- Load initial config from:
  1. Environment (during build)
  2. Runtime config endpoint
  3. Local storage (for user preferences)

### Settings UI

- Admin-only configuration panel
- Editable fields:
  - API Base URL
  - Polling interval
  - MAC address (if allowed)
- Validation for all inputs
- Save to backend via dedicated endpoint

## 3. Enhanced Implementation Details

### Security Considerations

- Never expose sensitive config in frontend
- Validate all configuration values
- Implement rate limiting for config changes
- Use HTTPS in production

### Error Handling

- Config validation errors
- Missing required values
- Network connectivity issues
- Permission errors

## 4. Updated Deployment Process

### Systemd Service Setup

1. Create service file at `/etc/systemd/system/pc-dashboard.service`:

   ```ini
   [Unit]
   Description=PC Dashboard Service
   After=network.target

   [Service]
   Environment=FASTAPI_URL=http://your-server-ip:8000
   Environment=TARGET_MAC=XX:XX:XX:XX:XX:XX
   Environment=POLL_INTERVAL=5000
   WorkingDirectory=/opt/pc-dashboard
   ExecStart=/usr/bin/node dist/server.js
   Restart=always
   User=server-dashboard

   [Install]
   WantedBy=multi-user.target
   ```

2. Enable and start service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable pc-dashboard
   sudo systemctl start pc-dashboard
   ```

### Native Installation Benefits

- Direct network interface access for WOL
- Better performance for network operations
- Simpler debugging of network issues
- No container networking complications

### Environment Setup

1. Copy `.env.template` to `.env`
2. Set required values:
   ```env
   FASTAPI_URL=http://your-server-ip:8000
   TARGET_MAC=XX:XX:XX:XX:XX:XX
   POLL_INTERVAL=5000
   ```
3. Add to `.gitignore`:
   ```
   .env
   ```
