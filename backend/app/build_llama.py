import subprocess
import os
import time
import shutil
import threading
from pathlib import Path
from typing import Generator


class BuildProcess:
    def __init__(self):
        self._should_stop = False
        self._process = None

    def stop(self):
        self._should_stop = True
        if self._process:
            self._process.terminate()


def build_llama(build_process: BuildProcess = None) -> Generator[str, None, bool]:
    repo_path = Path("/home/llama.cpp/repo")
    build_dir = repo_path / "build-wmma"
    timestamp = int(time.time())

    try:
        # Change ownership to server-dashboard for build
        yield "Changing repository ownership to server-dashboard...\n"
        chown_cmd = ["sudo", "chown", "-R",
                     "server-dashboard:users", str(repo_path)]
        chown = subprocess.Popen(
            chown_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in chown.stdout:
            yield line
        chown.wait()
        if chown.returncode != 0:
            raise subprocess.CalledProcessError(chown.returncode, chown.args)

        # Backup existing build if exists
        if build_dir.exists():
            backup_dir = repo_path / f"build-wmma.{timestamp}"
            shutil.move(str(build_dir), str(backup_dir))
            yield f"Backed up existing build to {backup_dir}\n"

        # Git pull
        yield "Pulling latest changes...\n"
        git_pull = subprocess.Popen(
            ["sudo", "-u", "llama.cpp", "git", "pull"],
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in git_pull.stdout:
            yield line
        git_pull.wait()
        if git_pull.returncode != 0:
            raise subprocess.CalledProcessError(
                git_pull.returncode, git_pull.args)

        # Configure build
        yield "Configuring build...\n"
        hipcxx = subprocess.check_output(
            ["hipconfig", "-l"]).decode().strip() + "/clang"
        hip_path = subprocess.check_output(
            ["hipconfig", "-R"]).decode().strip()

        configure_cmd = [
            "cmake", "-S", ".", "-B", "build-wmma",
            f"-DHIPCXX={hipcxx}",
            f"-DHIP_PATH={hip_path}",
            "-DGGML_HIP=ON",
            "-DGPU_TARGETS=gfx1100",
            "-DGGML_HIP_ROCWMMA_FATTN=ON",
            "-DCMAKE_CXX_FLAGS=-I/opt/rocm/include/rocwmma"
        ]
        configure = subprocess.Popen(
            ["sudo", "-u", "llama.cpp"] + configure_cmd,
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in configure.stdout:
            yield line
        configure.wait()
        if configure.returncode != 0:
            raise subprocess.CalledProcessError(
                configure.returncode, configure.args)

        # Build
        yield "Starting build...\n"
        build_cmd = ["cmake", "--build", "build-wmma",
                     "--config", "Release", "--", "-j", "16"]
        build = subprocess.Popen(
            ["sudo", "-u", "llama.cpp"] + build_cmd,
            cwd=repo_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        if build_process:
            build_process._process = build

        for line in build.stdout:
            if build_process and build_process._should_stop:
                build.terminate()
                yield "Build aborted by user\n"
                return False
            yield line

        build.wait()
        if build_process and build_process._should_stop:
            return False
        if build.returncode != 0:
            raise subprocess.CalledProcessError(build.returncode, build.args)

        yield "Build completed successfully!\n"

        # Restore ownership to llama.cpp
        yield "Restoring repository ownership to llama.cpp...\n"
        chown_cmd = ["sudo", "chown", "-R", "llama.cpp:users", str(repo_path)]
        chown = subprocess.Popen(
            chown_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in chown.stdout:
            yield line
        chown.wait()
        if chown.returncode != 0:
            yield "Warning: Failed to restore ownership to llama.cpp\n"

        return True

    except subprocess.CalledProcessError as e:
        yield f"Build failed with error: {e}\n"

        # Cleanup failed build
        if build_dir.exists():
            failed_dir = find_available_failed_dir(repo_path)
            shutil.move(str(build_dir), str(failed_dir))
            yield f"Moved failed build to {failed_dir}\n"

        # Restore backup if exists
        backup_dir = repo_path / f"build-wmma.{timestamp}"
        if backup_dir.exists():
            shutil.move(str(backup_dir), str(build_dir))
            yield f"Restored backup from {backup_dir}\n"

        # Restore ownership to llama.cpp on failure
        yield "Restoring repository ownership to llama.cpp...\n"
        chown_cmd = ["sudo", "chown", "-R", "llama.cpp:users", str(repo_path)]
        chown = subprocess.Popen(
            chown_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in chown.stdout:
            yield line
        chown.wait()
        if chown.returncode != 0:
            yield "Warning: Failed to restore ownership to llama.cpp\n"

        return False


def find_available_failed_dir(repo_path: Path) -> Path:
    counter = 0
    while True:
        failed_dir = repo_path / f"build-wmma.failed.{counter}"
        if not failed_dir.exists():
            return failed_dir
        counter += 1


class BuildThread(threading.Thread):
    def __init__(self, callback):
        threading.Thread.__init__(self)
        self.callback = callback
        self.result = None
        self.build_process = BuildProcess()

    def run(self):
        for output in build_llama(self.build_process):
            self.callback(output)
        self.result = output  # Last output contains the final status

    def stop(self):
        self.build_process.stop()
