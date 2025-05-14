import os
from fastapi import FastAPI, HTTPException
import httpx
from fastapi.responses import JSONResponse
import asyncio
import logging

app = FastAPI()

# Setup logging
logging.basicConfig(level=logging.INFO)

llama_server_url = os.getenv("LLAMA_SERVER_URL", "http://localhost:8080")


@app.get("/hc")
async def health_check():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{llama_server_url}/v1/models")
            response.raise_for_status()
            return {
                "status": "online",
                "llmServerStatus": "online"
            }
    except httpx.HTTPStatusError:
        return {
            "status": "online",
            "llmServerStatus": "offline"
        }
    except httpx.RequestError:
        return {
            "status": "online",
            "llmServerStatus": "offline"
        }


@app.post("/api/suspend")
async def suspend():
    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "suspend"
        )
        await process.wait()
        if process.returncode != 0:
            raise RuntimeError(
                f"Process failed with code {process.returncode}")
        return JSONResponse(
            status_code=200,
            content={"status": "suspending"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"System suspend failed: {str(e)}"
        )


@app.post("/api/llm/stop")
async def stop_llm():
    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "stop", "llama.cpp-server.service"
        )
        await process.wait()
        if process.returncode != 0:
            raise RuntimeError(
                f"Process failed with code {process.returncode}")
        return JSONResponse(
            status_code=200,
            content={"status": "stopping"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM stop failed: {str(e)}"
        )


@app.post("/api/llm/start")
async def start_llm():
    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "start", "llama.cpp-server.service"
        )
        await process.wait()
        if process.returncode != 0:
            raise RuntimeError(
                f"Process failed with code {process.returncode}")
        return JSONResponse(
            status_code=200,
            content={"status": "starting"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"LLM start failed: {str(e)}"
        )


@app.get("/api/llm/status")
async def llm_status():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{llama_server_url}/v1/models")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"LLM server returned error: {str(e)}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to LLM server: {str(e)}"
        )


@app.exception_handler(Exception)
async def custom_exception_handler(request, exc):
    logging.error(f"Error occurred: {str(exc)}")
    return await http_exception_handler(request, exc)
