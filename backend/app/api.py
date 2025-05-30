import re
from fastapi.responses import StreamingResponse
import os
from fastapi import FastAPI, HTTPException
from fastapi.exception_handlers import http_exception_handler
import httpx
from fastapi.responses import JSONResponse
import asyncio
import logging
import time
import json
from .build_llama import BuildThread as RealBuildThread
from .build_llama_mock import BuildThread as MockBuildThread

app = FastAPI()

# Setup logging
logging.basicConfig(level=logging.INFO)

llama_server_url = os.getenv("LLAMA_SERVER_URL", "http://localhost:8080")
comfyui_server_url = os.getenv("COMFYUI_SERVER_URL", "http://localhost:8188")
alltalk_server_url = os.getenv("ALLTALK_SERVER_URL", "http://localhost:8061")

VALID_SERVICES = {
    "llm": "llama.cpp-server.service",
    "comfyui": "comfyui-server.service",
    "alltalk-tts": "alltalk-server.service",
    "alltalk-finetune": "alltalk-finetune.service"
}

build_thread = None


def validate_service_name(service_name: str) -> None:
    """Validate service name against known services"""
    if service_name not in VALID_SERVICES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid service name. Valid services: {list(VALID_SERVICES.keys())}"
        )


@app.get("/hc")
async def health_check():
    try:
        async with httpx.AsyncClient() as client:
            # Check LLM server status
            llm_status = "online"
            try:
                await client.get(f"{llama_server_url}/v1/models")
            except httpx.HTTPStatusError:
                llm_status = "offline"
            except httpx.RequestError:
                llm_status = "offline"

            # Check ComfyUI server status
            comfyui_status = "online"
            try:
                await client.get(f"{comfyui_server_url}/system_stats")
            except httpx.HTTPStatusError:
                comfyui_status = "offline"
            except httpx.RequestError:
                comfyui_status = "offline"

            # Check AllTalk TTS server status
            alltalk_status = "online"
            try:
                response = await client.get(f"{alltalk_server_url}/api/ready")
            except httpx.HTTPStatusError:
                alltalk_status = "offline"
            except httpx.RequestError:
                alltalk_status = "offline"

            return {
                "status": "online",
                "llmServerStatus": llm_status,
                "comfyuiServerStatus": comfyui_status,
                "alltalkTtsServerStatus": alltalk_status
            }
    except Exception:
        return {
            "status": "online",
            "llmServerStatus": "offline",
            "comfyuiServerStatus": "offline",
            "alltalkTtsServerStatus": "offline"
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


@app.post("/api/service/{service_name}/start")
async def start_service(service_name: str):
    validate_service_name(service_name)

    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "start", VALID_SERVICES[service_name]
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
            detail=f"{service_name} start failed: {str(e)}"
        )


@app.post("/api/service/{service_name}/stop")
async def stop_service(service_name: str):
    validate_service_name(service_name)

    try:
        process = await asyncio.create_subprocess_exec(
            "sudo", "systemctl", "stop", VALID_SERVICES[service_name]
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
            detail=f"{service_name} start failed: {str(e)}"
        )


async def check_service_status(url: str) -> dict:
    """Check service status by making a GET request to the given URL"""
    client = None
    try:
        client = httpx.AsyncClient()
        await client.get(url)
        return {"status": "online"}
    except (httpx.HTTPStatusError, httpx.RequestError):
        return {"status": "offline"}
    finally:
        if client:
            await client.aclose()


@app.get("/api/service/{service_name}/status")
async def service_status(service_name: str):
    validate_service_name(service_name)

    status_urls = {
        "llm": f"{llama_server_url}/v1/models",
        "comfyui": f"{comfyui_server_url}/system_stats",
        "alltalk-tts": f"{alltalk_server_url}/api/ready",
        # TODO: Update with actual finetune endpoint
        "alltalk-finetune": f"{alltalk_server_url}/api/ready"
    }

    return await check_service_status(status_urls[service_name])

SERVICE_NAME_PATTERN = r"^[a-zA-Z0-9\-\.]+$"


@app.get("/api/logs/{service_name}")
async def stream_logs(service_name: str):
    """Stream logs for a specific service using journalctl"""
    if not re.match(SERVICE_NAME_PATTERN, service_name):
        raise HTTPException(status_code=400, detail="Invalid service name")

    cmd = f"sudo journalctl -f -u {service_name}"
    proc = await asyncio.create_subprocess_shell(
        cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT
    )

    async def generate():
        try:
            while True:
                line = await proc.stdout.readline()
                if not line:
                    break
                yield f"{line.decode()}"
        finally:
            proc.terminate()
            try:
                await proc.wait()
            except:
                pass

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/api/build-llama")
async def trigger_build(mock: bool = False):
    global build_thread

    if build_thread and build_thread.is_alive():
        return {"status": "error", "message": "Build already in progress"}

    output_queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def callback(data):
        asyncio.run_coroutine_threadsafe(
            output_queue.put({'output': data}),
            loop
        )

    build_thread = MockBuildThread(
        callback) if mock else RealBuildThread(callback)
    build_thread.start()

    async def stream_generator():
        try:
            while True:
                data = await output_queue.get()
                yield f"{json.dumps(data)}\n"

                # Check if thread is done and queue is empty
                if not build_thread.is_alive() and output_queue.empty():
                    break

            yield f"{json.dumps({'status': 'completed', 'success': build_thread.result})}\n\n"
        finally:
            if build_thread.is_alive():
                build_thread.stop()

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream"
    )


@app.post("/api/build-llama/abort")
async def abort_build():
    global build_thread

    if not build_thread or not build_thread.is_alive():
        return {"status": "error", "message": "No active build to abort"}

    # Stop the build thread first
    build_thread.stop()

    # Restore ownership to llama.cpp
    repo_path = "/home/llama.cpp/repo"
    chown_cmd = ["sudo", "chown", "-R", "llama.cpp:users", repo_path]
    try:
        process = await asyncio.create_subprocess_exec(
            *chown_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            return {
                "status": "warning",
                "message": "Build aborted but ownership restore failed",
                "details": stderr.decode().strip()
            }
    except Exception as e:
        return {
            "status": "warning",
            "message": "Build aborted but ownership restore failed",
            "details": str(e)
        }

    # Try to restore backup if exists
    try:
        repo_path = Path(repo_path)
        build_dir = repo_path / "build-wmma"
        backup_dirs = sorted(repo_path.glob("build-wmma.*"),
                             key=os.path.getmtime, reverse=True)

        if backup_dirs and backup_dirs[0].exists():
            shutil.move(str(backup_dirs[0]), str(build_dir))
            return {
                "status": "success",
                "message": "Build aborted and backup restored",
                "backup_restored": str(backup_dirs[0])
            }
    except Exception as e:
        return {
            "status": "warning",
            "message": "Build aborted but backup restore failed",
            "details": str(e)
        }

    return {"status": "success", "message": "Build aborted"}


# @app.exception_handler(Exception)
# async def custom_exception_handler(request, exc):
#     logging.error(f"Error occurred: {str(exc)}")
#     return await http_exception_handler(request, exc)
