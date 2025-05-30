import threading
import time
import json
from typing import Generator


class MockBuildProcess:
    def __init__(self):
        self._should_stop = False

    def stop(self):
        self._should_stop = True


def mock_build_llama(build_process: MockBuildProcess = None) -> Generator[str, None, bool]:
    """Simulate a build process that can be aborted"""
    steps = [
        "Starting mock build process...",
        "Initializing build environment...",
        "Downloading dependencies...",
        "Compiling core components (10%)...",
        "Compiling core components (25%)...",
        "Compiling core components (50%)...",
        "Compiling core components (75%)...",
        "Linking binaries...",
        "Running tests...",
        "Build completed successfully!"
    ]

    for step in steps:
        if build_process and build_process._should_stop:
            yield "Build aborted by user\n"
            return False

        yield f"{step}\n"
        time.sleep(2)  # Simulate work between steps

    return True


class BuildThread(threading.Thread):
    """Mock version of BuildThread for testing abort functionality"""

    def __init__(self, callback):
        threading.Thread.__init__(self)
        self.callback = callback
        self.result = None
        self.build_process = MockBuildProcess()

    def run(self):
        try:
            for output in mock_build_llama(self.build_process):
                # Ensure output is properly formatted for streaming
                self.callback({'output': output.strip()})
            self.result = True if "successfully" in output else False
        except Exception as e:
            self.callback({'error': str(e)})
            self.result = False

    def stop(self):
        self.build_process.stop()
