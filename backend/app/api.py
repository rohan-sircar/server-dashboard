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
comfyui_server_url = os.getenv("COMFYUI_SERVER_URL", "http://localhost:8188")
alltalk_server_url = os.getenv("ALLTALK_SERVER_URL", "http://localhost:8061")


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


@app.post("/api/comfyui/stop")
async def stop_comfyui():
    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "stop", "comfyui-server.service"
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
            detail=f"ComfyUI stop failed: {str(e)}"
        )


@app.post("/api/comfyui/start")
async def start_comfyui():
    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "start", "comfyui-server.service"
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
            detail=f"ComfyUI start failed: {str(e)}"
        )


@app.get("/api/comfyui/status")
async def comfyui_status():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{comfyui_server_url}/system_stats")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"ComfyUI server returned error: {str(e)}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to ComfyUI server: {str(e)}"
        )


@app.post("/api/alltalk-tts/stop")
async def stop_alltalk():
    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "stop", "alltalk-server.service"
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
            detail=f"AllTalk TTS stop failed: {str(e)}"
        )


@app.post("/api/alltalk-tts/start")
async def start_alltalk():
    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "start", "alltalk-server.service"
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
            detail=f"AllTalk TTS start failed: {str(e)}"
        )


@app.get("/api/alltalk-tts/status")
async def alltalk_status():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{alltalk_server_url}/api/ready")
            response.raise_for_status()
            if response.text == "Ready":
                return {"status": "ready"}
            else:
                raise HTTPException(
                    status_code=502,
                    detail=f"AllTalk TTS server returned unexpected response: {response.text}"
                )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"AllTalk TTS server returned error: {str(e)}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Could not connect to AllTalk TTS server: {str(e)}"
        )


@app.exception_handler(Exception)
async def custom_exception_handler(request, exc):
    logging.error(f"Error occurred: {str(exc)}")
    return await http_exception_handler(request, exc)
