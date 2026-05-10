#!/usr/bin/env python3
"""
Test script for Advanced File Host API
Tests all major endpoints and functionality
"""

import asyncio
import json
import tempfile
from pathlib import Path
import httpx

BASE_URL = "http://localhost:8000"

async def test_health():
    """Test health endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        print("✅ Health check passed")

async def test_root():
    """Test root endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "endpoints" in data
        print("✅ Root endpoint passed")

async def test_web_ui():
    """Test web UI endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/app")
        assert response.status_code == 200
        assert "<!DOCTYPE html>" in response.text
        assert "Advanced File Host" in response.text
        assert "uploadFile" in response.text
        print("✅ Web UI endpoint passed")

async def test_file_upload_and_download():
    """Test file upload and download"""
    # Create test file
    test_content = b"This is a test file for encryption"
    test_filename = "test.txt"
    
    async with httpx.AsyncClient() as client:
        # Upload file
        files = {"file": (test_filename, test_content, "text/plain")}
        response = await client.post(f"{BASE_URL}/upload", files=files)
        
        assert response.status_code == 200
        upload_data = response.json()
        
        assert "file_id" in upload_data
        assert "url" in upload_data
        assert upload_data["name"] == test_filename
        assert upload_data["size"] == len(test_content)
        
        file_id = upload_data["file_id"]
        file_type = upload_data["file_type"]
        
        print(f"✅ File uploaded successfully (ID: {file_id})")
        
        # Download file
        download_url = f"{BASE_URL}/{file_type}/{file_id}"
        response = await client.get(download_url)
        
        assert response.status_code == 200
        assert response.content == test_content
        
        print(f"✅ File downloaded and decrypted successfully")

async def test_list_files():
    """Test list files endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/files")
        assert response.status_code == 200
        files = response.json()
        assert isinstance(files, list)
        print(f"✅ Files list endpoint passed (found {len(files)} files)")

async def test_image_upload():
    """Test image upload and retrieval"""
    # Create a minimal valid PNG (1x1 transparent pixel)
    png_data = bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a"
        "49444154789c6300010000050001000d0a2db40000000049454e44ae426082"
    )
    
    async with httpx.AsyncClient() as client:
        files = {"file": ("test.png", png_data, "image/png")}
        response = await client.post(f"{BASE_URL}/upload", files=files)
        
        assert response.status_code == 200
        upload_data = response.json()
        assert upload_data["file_type"] == "image"
        
        file_id = upload_data["file_id"]
        response = await client.get(f"{BASE_URL}/image/{file_id}")
        
        assert response.status_code == 200
        assert response.content == png_data
        
        print("✅ Image upload and retrieval passed")

async def test_video_upload():
    """Test video upload (minimal MP4 header)"""
    # Minimal MP4 file (just header, not playable but valid format)
    mp4_data = b"\x00\x00\x00\x20ftypisom\x00\x00\x00\x00isomiso2avc1mp41"
    
    async with httpx.AsyncClient() as client:
        files = {"file": ("test.mp4", mp4_data, "video/mp4")}
        response = await client.post(f"{BASE_URL}/upload", files=files)
        
        assert response.status_code == 200
        upload_data = response.json()
        assert upload_data["file_type"] == "video"
        
        file_id = upload_data["file_id"]
        response = await client.get(f"{BASE_URL}/video/{file_id}")
        
        assert response.status_code == 200
        assert response.content == mp4_data
        
        print("✅ Video upload and retrieval passed")

async def test_audio_upload():
    """Test audio upload"""
    # Minimal MP3 file (just header)
    mp3_data = b"ID3\x04\x00\x00\x00\x00\x00\x00"
    
    async with httpx.AsyncClient() as client:
        files = {"file": ("test.mp3", mp3_data, "audio/mpeg")}
        response = await client.post(f"{BASE_URL}/upload", files=files)
        
        assert response.status_code == 200
        upload_data = response.json()
        assert upload_data["file_type"] == "audio"
        
        file_id = upload_data["file_id"]
        response = await client.get(f"{BASE_URL}/audio/{file_id}")
        
        assert response.status_code == 200
        assert response.content == mp3_data
        
        print("✅ Audio upload and retrieval passed")

async def test_nonexistent_file():
    """Test retrieving nonexistent file"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/file/nonexistent-id")
        assert response.status_code == 404
        print("✅ Nonexistent file handling passed")

async def run_all_tests():
    """Run all tests"""
    print("\n" + "="*50)
    print("Advanced File Host - API Tests")
    print("="*50 + "\n")
    
    try:
        await test_health()
        await test_root()
        await test_web_ui()
        await test_list_files()
        await test_file_upload_and_download()
        await test_image_upload()
        await test_video_upload()
        await test_audio_upload()
        await test_nonexistent_file()
        
        print("\n" + "="*50)
        print("✅ All tests passed!")
        print("="*50 + "\n")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        raise
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(run_all_tests())
