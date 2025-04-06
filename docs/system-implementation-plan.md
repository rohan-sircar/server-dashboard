# Updated Implementation Plan: Remote PC Monitoring and Control Dashboard

## 1. Backend Implementation (PC Server)

- Set up Python virtual environment
- Install FastAPI and uvicorn
- Create FastAPI application with:
  - Health check endpoint (/api/hc)
  - Suspend endpoint (/api/suspend)
- Create dedicated user account `server-dashboard`
- Configure sudoers for passwordless suspend command
- Create systemd service file for backend
- Test service using systemctl

## 2. Frontend Implementation (Rock64 SBC)

- Initialize React project with TypeScript
- Create components:
  - StatusIndicator (polls /api/hc)
  - WakeButton (triggers Node.js endpoint)
  - SuspendButton (calls FastAPI endpoint)
- Set up Node.js server for wake command
- Create dedicated user account `server-dashboard`
- Configure sudoers for passwordless etherwake
- Create systemd service file for frontend
- Implement error handling and loading states

## 3. Network Configuration

- Ensure proper network connectivity between devices
- Configure firewalls and security settings
- Set up static IPs or DNS for reliable connections

## 4. Testing & Integration

- Test all functionality:
  - Wake command
  - Suspend command
  - Status polling
- Implement error handling and user feedback
- Test edge cases and failure scenarios

## 5. System Configuration

- Create and configure systemd service files:
  - Backend service on PC server
  - Frontend service on Rock64
  - Node.js service on Rock64
- Set up proper permissions and user accounts
- Configure logging and monitoring through systemd

## 6. Documentation & Maintenance

- Document configuration (IPs, MAC addresses, ports)
- Create setup and maintenance guides
- Implement update processes
