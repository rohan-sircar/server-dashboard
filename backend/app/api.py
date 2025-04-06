from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import subprocess
import logging

app = FastAPI()

# Setup logging
logging.basicConfig(filename='server.log', level=logging.INFO)

@app.get("/hc")
async def health_check():
    return {"status": "online"}

@app.post("/api/suspend")
async def suspend():
    try:
        subprocess.run(["sudo", "systemctl", "suspend"], check=True)
        return JSONResponse(
            status_code=200,
            content={"status": "suspending"}
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"System suspend failed: {str(e)}"
        )

@app.exception_handler(Exception)
async def custom_exception_handler(request, exc):
    logging.error(f"Error occurred: {str(exc)}")
    return await http_exception_handler(request, exc)