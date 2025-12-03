"""Tests for binary management."""

import platform
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from senseai.binary import BinaryManager
from senseai.exceptions import BinaryNotFoundError


class TestBinaryManager:
    """Test suite for BinaryManager."""

    def test_get_platform_info_macos(self):
        """Test platform detection on macOS."""
        with patch("platform.system", return_value="Darwin"):
            with patch("platform.machine", return_value="arm64"):
                os_name, arch = BinaryManager.get_platform_info()
                assert os_name == "darwin"
                assert arch == "arm64"

    def test_get_platform_info_linux(self):
        """Test platform detection on Linux."""
        with patch("platform.system", return_value="Linux"):
            with patch("platform.machine", return_value="x86_64"):
                os_name, arch = BinaryManager.get_platform_info()
                assert os_name == "linux"
                assert arch == "amd64"

    def test_get_cache_dir(self):
        """Test cache directory creation."""
        manager = BinaryManager()
        cache_dir = manager.get_cache_dir()
        
        assert cache_dir.exists()
        assert cache_dir.is_dir()
        assert "senseai" in str(cache_dir)

    def test_find_in_path_success(self):
        """Test finding binary in PATH."""
        manager = BinaryManager()
        
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="/usr/local/bin/sense\n"
            )
            
            result = manager._find_in_path()
            assert result == Path("/usr/local/bin/sense")

    def test_find_in_path_not_found(self):
        """Test binary not in PATH."""
        manager = BinaryManager()
        
        with patch("subprocess.run") as mock_run:
            mock_run.return_value = MagicMock(returncode=1, stdout="")
            
            result = manager._find_in_path()
            assert result is None

    def test_verify_binary_success(self):
        """Test binary verification."""
        manager = BinaryManager()
        
        with patch.object(manager, "get_binary_path", return_value=Path("/usr/local/bin/sense")):
            with patch("subprocess.run") as mock_run:
                mock_run.return_value = MagicMock(returncode=0)
                
                assert manager.verify_binary() is True

    def test_verify_binary_failure(self):
        """Test binary verification failure."""
        manager = BinaryManager()
        
        with patch.object(manager, "get_binary_path", side_effect=BinaryNotFoundError("Not found")):
            assert manager.verify_binary() is False

    def test_make_executable(self, tmp_path):
        """Test making file executable."""
        test_file = tmp_path / "test_binary"
        test_file.write_text("#!/bin/bash\necho test")
        
        BinaryManager._make_executable(test_file)
        
        # Check if file is executable (Unix only)
        if platform.system() != "Windows":
            import os
            assert os.access(test_file, os.X_OK)
