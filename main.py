"""
Advanced File Host - Python FastAPI Backend
Converted from Cloudflare Worker JavaScript
Features: File encryption, Web UI, Telegram bot integration
"""

import os
import json
import uuid
import base64
import secrets
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import httpx
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(title="Advanced File Host", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage paths
STORAGE_DIR = Path("storage")
FILES_DIR = STORAGE_DIR / "files"
KEYS_DIR = STORAGE_DIR / "keys"
METADATA_DIR = STORAGE_DIR / "metadata"

# Create directories if they don't exist
for directory in [FILES_DIR, KEYS_DIR, METADATA_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Environment variables
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_OWNER_ID = os.getenv("TELEGRAM_OWNER_ID", "6468293575")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")

# ============================================================================
# Encryption Utilities
# ============================================================================

def generate_key() -> bytes:
    """Generate a 256-bit AES key"""
    return secrets.token_bytes(32)


def export_key(key: bytes) -> Dict[str, Any]:
    """Export key to JWK-like format"""
    return {
        "kty": "oct",
        "k": base64.urlsafe_b64encode(key).decode().rstrip("="),
        "alg": "A256GCM",
        "ext": True,
        "key_ops": ["encrypt", "decrypt"]
    }


def import_key(key_data: Dict[str, Any]) -> bytes:
    """Import key from JWK-like format"""
    k_value = key_data.get("k", "")
    # Add padding if necessary
    padding = 4 - (len(k_value) % 4)
    if padding != 4:
        k_value += "=" * padding
    return base64.urlsafe_b64decode(k_value)


def encrypt_data(data: bytes, key: bytes) -> Dict[str, str]:
    """Encrypt data using AES-GCM"""
    iv = secrets.token_bytes(12)  # 96-bit IV
    cipher = AESGCM(key)
    ciphertext = cipher.encrypt(iv, data, None)
    
    return {
        "iv": ",".join(str(b) for b in iv),
        "data": ",".join(str(b) for b in ciphertext)
    }


def decrypt_data(encrypted_data: Dict[str, str], key: bytes) -> bytes:
    """Decrypt data using AES-GCM"""
    iv = bytes(int(b) for b in encrypted_data["iv"].split(","))
    ciphertext = bytes(int(b) for b in encrypted_data["data"].split(","))
    
    cipher = AESGCM(key)
    plaintext = cipher.decrypt(iv, ciphertext, None)
    
    return plaintext


# ============================================================================
# File Storage Utilities
# ============================================================================

def get_file_type(mime_type: str, filename: str) -> str:
    """Get file type category"""
    type_prefix = mime_type.split("/")[0]
    if type_prefix in ["image", "video", "audio"]:
        return type_prefix
    return "file"


def save_encrypted_file(file_data: bytes, file_name: str, mime_type: str) -> Dict[str, Any]:
    """Save file with encryption"""
    file_id = str(uuid.uuid4())
    file_type = get_file_type(mime_type, file_name)
    
    # Ensure directories exist
    FILES_DIR.mkdir(parents=True, exist_ok=True)
    KEYS_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)
    
    # Generate encryption key
    key = generate_key()
    key_data = export_key(key)
    
    # Encrypt file data
    encrypted = encrypt_data(file_data, key)
    
    # Save encrypted file
    file_path = FILES_DIR / f"{file_type}_{file_id}.enc"
    with open(file_path, "w") as f:
        json.dump(encrypted, f)
    
    # Save key
    key_path = KEYS_DIR / f"key_{file_type}_{file_id}.json"
    with open(key_path, "w") as f:
        json.dump(key_data, f)
    
    # Save metadata
    metadata = {
        "name": file_name,
        "type": mime_type,
        "size": len(file_data),
        "uploaded_at": datetime.utcnow().isoformat()
    }
    meta_path = METADATA_DIR / f"meta_{file_type}_{file_id}.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f)
    
    return {
        "file_id": file_id,
        "file_type": file_type,
        "url": f"{API_BASE_URL}/{file_type}/{file_id}",
        "name": file_name,
        "type": mime_type,
        "size": len(file_data)
    }


def retrieve_encrypted_file(file_id: str, file_type: str) -> Optional[bytes]:
    """Retrieve and decrypt file"""
    try:
        # Load encrypted file
        file_path = FILES_DIR / f"{file_type}_{file_id}.enc"
        if not file_path.exists():
            return None
        
        with open(file_path, "r") as f:
            encrypted = json.load(f)
        
        # Load key
        key_path = KEYS_DIR / f"key_{file_type}_{file_id}.json"
        if not key_path.exists():
            return None
        
        with open(key_path, "r") as f:
            key_data = json.load(f)
        
        # Decrypt
        key = import_key(key_data)
        plaintext = decrypt_data(encrypted, key)
        
        return plaintext
    except Exception as e:
        print(f"Error retrieving file: {e}")
        return None


def get_file_metadata(file_id: str, file_type: str) -> Optional[Dict[str, Any]]:
    """Get file metadata"""
    try:
        meta_path = METADATA_DIR / f"meta_{file_type}_{file_id}.json"
        if not meta_path.exists():
            return None
        
        with open(meta_path, "r") as f:
            return json.load(f)
    except Exception:
        return None


# ============================================================================
# Web UI
# ============================================================================

def get_web_interface(base_url: str) -> str:
    """Generate the web interface HTML"""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced File Host</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .dropzone {{
            border: 2px dashed #ccc;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
        }}
        .dropzone.active {{
            border-color: #3b82f6;
            background-color: #f0f7ff;
        }}
        .file-icon {{
            width: 48px;
            height: 48px;
            font-size: 24px;
        }}
        .progress-bar {{
            height: 6px;
            background-color: #e5e7eb;
            border-radius: 3px;
            overflow: hidden;
        }}
        .progress {{
            height: 100%;
            background-color: #3b82f6;
            transition: width 0.3s;
        }}
        .fade-out {{
            animation: fadeOut 0.3s forwards;
        }}
        @keyframes fadeOut {{
            to {{
                opacity: 0;
            }}
        }}
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-blue-600 mb-2">Advanced File Host</h1>
            <p class="text-gray-600">Upload and share any type of file securely</p>
        </header>

        <div class="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
            <div id="dropzone" class="dropzone"
                ondragover="event.preventDefault(); document.getElementById('dropzone').classList.add('active')"
                ondragleave="document.getElementById('dropzone').classList.remove('active')"
                ondrop="event.preventDefault(); document.getElementById('dropzone').classList.remove('active'); handleFiles(event.dataTransfer.files)">
                <div class="flex flex-col items-center justify-center space-y-4">
                    <i class="fas fa-cloud-upload-alt text-4xl text-blue-400"></i>
                    <p class="text-lg font-medium text-gray-700">Drag & drop files here</p>
                    <p class="text-sm text-gray-500">or</p>
                    <label for="fileInput" class="px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition">
                        <i class="fas fa-folder-open mr-2"></i> Select Files
                    </label>
                    <input id="fileInput" type="file" class="hidden" multiple onchange="handleFiles(this.files)">
                </div>
            </div>

            <div id="uploadProgress" class="mt-4 hidden">
                <div class="flex justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">Uploading...</span>
                    <span id="progressPercent" class="text-sm font-medium text-gray-700">0%</span>
                </div>
                <div class="progress-bar">
                    <div id="progressBar" class="progress" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <div id="uploadedFiles" class="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">Your Files</h2>
            <div id="fileList" class="space-y-4">
                <!-- Files will appear here -->
            </div>
        </div>
    </div>

    <div id="notification" class="fixed bottom-4 right-4 hidden px-4 py-2 rounded-md shadow-lg"></div>

    <script>
        const API_BASE = "{base_url}";
        
        // DOM elements
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('fileInput');
        const uploadProgress = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const fileList = document.getElementById('fileList');
        const notification = document.getElementById('notification');

        // Handle file selection
        async function handleFiles(files) {{
            if (!files || files.length === 0) return;
            
            for (const file of files) {{
                await uploadFile(file);
            }}
        }}

        // Upload file to API
        async function uploadFile(file) {{
            try {{
                uploadProgress.classList.remove('hidden');
                progressBar.style.width = '0%';
                progressPercent.textContent = '0%';

                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(API_BASE + '/upload', {{
                    method: 'POST',
                    body: formData
                }});
                
                if (response.ok) {{
                    const result = await response.json();
                    addFileCard(result);
                    showNotification('File uploaded successfully!');
                }} else {{
                    const error = await response.json();
                    showNotification(error.detail || 'Upload failed', true);
                }}
            }} catch (error) {{
                console.error('Upload error:', error);
                showNotification('An error occurred during upload', true);
            }} finally {{
                uploadProgress.classList.add('hidden');
            }}
        }}

        // Add file card to UI
        function addFileCard(fileData) {{
            const fileId = 'file-' + Date.now();
            const icon = getFileIcon(fileData.type, fileData.name);
            const size = formatFileSize(fileData.size);
            const isPreviewable = ['image', 'audio', 'video'].some(type => fileData.type.includes(type));

            const fileCard = document.createElement('div');
            fileCard.className = 'file-card bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200';
            fileCard.id = fileId;

            if (fileData.type.startsWith('image/')) {{
                fileCard.innerHTML = `
                    <div class="h-48 overflow-hidden">
                        <img src="${{fileData.url}}" alt="${{fileData.name}}" class="w-full h-full object-contain">
                    </div>
                    <div class="p-4">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-medium text-gray-800 truncate">${{fileData.name}}</h3>
                            <span class="text-xs text-gray-500 whitespace-nowrap ml-2">${{size}}</span>
                        </div>
                        <div class="flex items-center">
                            <input type="text" value="${{fileData.url}}" id="url-${{fileId}}" 
                                   class="flex-1 text-sm border border-gray-300 rounded-l-md px-2 py-1 truncate" readonly>
                            <button onclick="copyUrl('url-${{fileId}}')" 
                                    class="bg-blue-500 text-white px-3 py-1 rounded-r-md text-sm hover:bg-blue-600 transition">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                `;
            }} else if (isPreviewable) {{
                fileCard.innerHTML = `
                    <div class="p-4">
                        <div class="flex items-center mb-3">
                            <div class="file-icon rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                                <i class="fas ${{icon}}"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-medium text-gray-800 truncate">${{fileData.name}}</h3>
                                <p class="text-xs text-gray-500">${{size}}</p>
                            </div>
                        </div>
                        ${{fileData.type.startsWith('video/') ? `
                        <div class="mb-3">
                            <video controls class="w-full rounded">
                                <source src="${{fileData.url}}" type="${{fileData.type}}">
                            </video>
                        </div>
                        ` : ''}}
                        ${{fileData.type.startsWith('audio/') ? `
                        <div class="mb-3">
                            <audio controls class="w-full">
                                <source src="${{fileData.url}}" type="${{fileData.type}}">
                            </audio>
                        </div>
                        ` : ''}}
                        <div class="flex items-center">
                            <input type="text" value="${{fileData.url}}" id="url-${{fileId}}" 
                                   class="flex-1 text-sm border border-gray-300 rounded-l-md px-2 py-1 truncate" readonly>
                            <button onclick="copyUrl('url-${{fileId}}')" 
                                    class="bg-blue-500 text-white px-3 py-1 rounded-r-md text-sm hover:bg-blue-600 transition">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                `;
            }} else {{
                fileCard.innerHTML = `
                    <div class="p-4">
                        <div class="flex items-center mb-3">
                            <div class="file-icon rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                                <i class="fas ${{icon}}"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-medium text-gray-800 truncate">${{fileData.name}}</h3>
                                <p class="text-xs text-gray-500">${{size}}</p>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <input type="text" value="${{fileData.url}}" id="url-${{fileId}}" 
                                   class="flex-1 text-sm border border-gray-300 rounded-l-md px-2 py-1 truncate" readonly>
                            <button onclick="copyUrl('url-${{fileId}}')" 
                                    class="bg-blue-500 text-white px-3 py-1 rounded-r-md text-sm hover:bg-blue-600 transition">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                `;
            }}

            fileList.prepend(fileCard);
        }}

        // Copy URL to clipboard
        function copyUrl(inputId) {{
            const input = document.getElementById(inputId);
            input.select();
            document.execCommand('copy');
            showNotification('URL copied to clipboard!');
        }}

        // Show notification
        function showNotification(message, isError = false) {{
            notification.textContent = message;
            notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg notification ${{
                isError ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }}`;
            notification.classList.remove('hidden');
            
            setTimeout(() => {{
                notification.classList.add('fade-out');
                setTimeout(() => notification.classList.add('hidden'), 300);
            }}, 3000);
        }}

        // Format file size
        function formatFileSize(bytes) {{
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }}

        // Get appropriate icon for file type
        function getFileIcon(mimeType, filename) {{
            const extension = filename.split('.').pop().toLowerCase();
            const type = mimeType.split('/')[0];
            
            const icons = {{
                image: 'fa-image',
                audio: 'fa-music',
                video: 'fa-film',
                text: 'fa-file-alt',
                application: {{
                    pdf: 'fa-file-pdf',
                    msword: 'fa-file-word',
                    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
                    'vnd.ms-excel': 'fa-file-excel',
                    'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fa-file-excel',
                    'vnd.ms-powerpoint': 'fa-file-powerpoint',
                    'vnd.openxmlformats-officedocument.presentationml.presentation': 'fa-file-powerpoint',
                    'zip': 'fa-file-archive',
                    'x-rar-compressed': 'fa-file-archive',
                    'x-7z-compressed': 'fa-file-archive',
                    'octet-stream': 'fa-file',
                    default: 'fa-file'
                }},
                default: 'fa-file'
            }};
            
            if (type === 'application') {{
                const subtype = mimeType.split('/')[1];
                return icons.application[subtype] || icons.application[extension] || icons.application.default;
            }}
            
            return icons[type] || icons.default;
        }}

        // Load recent files on page load
        document.addEventListener('DOMContentLoaded', async () => {{
            try {{
                const response = await fetch(API_BASE + '/files');
                if (response.ok) {{
                    const files = await response.json();
                    files.forEach(file => addFileCard(file));
                }}
            }} catch (error) {{
                console.error('Error loading files:', error);
            }}
        }});
    </script>
</body>
</html>"""


# ============================================================================
# API Routes
# ============================================================================

@app.get("/app", response_class=HTMLResponse)
async def get_app(request: Request):
    """Serve web interface at /app"""
    # Get the base URL from request
    base_url = f"{request.url.scheme}://{request.headers.get('host', 'localhost:8000')}"
    return get_web_interface(base_url)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file upload"""
    try:
        # Read file content
        content = await file.read()
        
        # Save encrypted file
        result = save_encrypted_file(
            content,
            file.filename or "unnamed",
            file.content_type or "application/octet-stream"
        )
        
        return JSONResponse(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/files")
async def list_files():
    """List all uploaded files"""
    files = []
    try:
        for meta_file in METADATA_DIR.glob("meta_*.json"):
            with open(meta_file, "r") as f:
                metadata = json.load(f)
            
            # Extract file_id and type from filename
            parts = meta_file.stem.replace("meta_", "").rsplit("_", 1)
            if len(parts) == 2:
                file_type, file_id = parts
                files.append({
                    "url": f"{API_BASE_URL}/{file_type}/{file_id}",
                    "name": metadata.get("name", "unknown"),
                    "type": metadata.get("type", "application/octet-stream"),
                    "size": metadata.get("size", 0)
                })
    except Exception as e:
        print(f"Error listing files: {e}")
    
    return files


@app.get("/file/{file_id}")
async def get_file(file_id: str):
    """Retrieve a file (generic endpoint)"""
    try:
        # Try to find the file
        for file_path in FILES_DIR.glob(f"*_{file_id}.enc"):
            file_type = file_path.stem.split("_")[0]
            file_data = retrieve_encrypted_file(file_id, file_type)
            
            if file_data:
                metadata = get_file_metadata(file_id, file_type)
                if metadata:
                    from io import BytesIO
                    return StreamingResponse(
                        BytesIO(file_data),
                        media_type=metadata.get("type", "application/octet-stream"),
                        headers={"Content-Disposition": f"attachment; filename={metadata.get('name', 'file')}"}
                    )
        
        raise HTTPException(status_code=404, detail="File not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/image/{file_id}")
async def get_image(file_id: str):
    """Retrieve an image"""
    try:
        file_data = retrieve_encrypted_file(file_id, "image")
        if not file_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        metadata = get_file_metadata(file_id, "image")
        from io import BytesIO
        return StreamingResponse(
            BytesIO(file_data),
            media_type=metadata.get("type", "image/jpeg") if metadata else "image/jpeg",
            headers={"Content-Disposition": f"inline; filename={metadata.get('name', 'image.jpg') if metadata else 'image.jpg'}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/video/{file_id}")
async def get_video(file_id: str):
    """Retrieve a video"""
    try:
        file_data = retrieve_encrypted_file(file_id, "video")
        if not file_data:
            raise HTTPException(status_code=404, detail="Video not found")
        
        metadata = get_file_metadata(file_id, "video")
        from io import BytesIO
        return StreamingResponse(
            BytesIO(file_data),
            media_type=metadata.get("type", "video/mp4") if metadata else "video/mp4",
            headers={"Content-Disposition": f"inline; filename={metadata.get('name', 'video.mp4') if metadata else 'video.mp4'}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/audio/{file_id}")
async def get_audio(file_id: str):
    """Retrieve audio"""
    try:
        file_data = retrieve_encrypted_file(file_id, "audio")
        if not file_data:
            raise HTTPException(status_code=404, detail="Audio not found")
        
        metadata = get_file_metadata(file_id, "audio")
        from io import BytesIO
        return StreamingResponse(
            BytesIO(file_data),
            media_type=metadata.get("type", "audio/mpeg") if metadata else "audio/mpeg",
            headers={"Content-Disposition": f"inline; filename={metadata.get('name', 'audio.mp3') if metadata else 'audio.mp3'}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Telegram Bot Webhook
# ============================================================================

@app.post("/telegram/webhook")
async def telegram_webhook(request: Request):
    """Handle Telegram webhook"""
    try:
        update = await request.json()
        
        # Extract message info
        message = update.get("message", {})
        chat_id = message.get("chat", {}).get("id")
        text = message.get("text", "")
        
        if not chat_id:
            return JSONResponse({"ok": True})
        
        # Handle /start command
        if text == "/start":
            response_text = "<b>📸 Welcome to upload bot!</b>\n\n<i>✅ You can upload your files and get URL for your file</i>\n\nℹ️ Send any file to upload"
            keyboard = {
                "inline_keyboard": [
                    [{"text": "Developer Channel", "url": "https://t.me/Yagami_xlight"}],
                    [{"text": "Owner", "url": f"tg://user?id={TELEGRAM_OWNER_ID}"}]
                ]
            }
            await send_telegram_message(chat_id, response_text, keyboard)
        
        # Handle file uploads
        elif message.get("document") or message.get("photo") or message.get("video") or message.get("audio"):
            file_id = None
            file_type = "file"
            
            if message.get("document"):
                file_id = message["document"]["file_id"]
                file_type = "file"
            elif message.get("photo"):
                file_id = message["photo"][-1]["file_id"]
                file_type = "image"
            elif message.get("video"):
                file_id = message["video"]["file_id"]
                file_type = "video"
            elif message.get("audio"):
                file_id = message["audio"]["file_id"]
                file_type = "audio"
            
            if file_id:
                file_url = await get_telegram_file(file_id)
                if file_url:
                    saved_url = await save_file_from_telegram(file_url, file_type)
                    if saved_url:
                        response_text = f"<b>📁 File uploaded!</b>\n\n🔗 <code>{saved_url}</code>"
                        await send_telegram_message(chat_id, response_text)
                    else:
                        await send_telegram_message(chat_id, "Failed to save the file.")
        
        return JSONResponse({"ok": True})
    except Exception as e:
        print(f"Telegram webhook error: {e}")
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


async def send_telegram_message(chat_id: int, text: str, keyboard: Optional[Dict] = None):
    """Send message via Telegram Bot API"""
    if not TELEGRAM_BOT_TOKEN:
        return
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    if keyboard:
        payload["reply_markup"] = keyboard
    
    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload)


async def get_telegram_file(file_id: str) -> Optional[str]:
    """Get file URL from Telegram"""
    if not TELEGRAM_BOT_TOKEN:
        return None
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        result = response.json()
        
        if result.get("ok") and result.get("result", {}).get("file_path"):
            file_path = result["result"]["file_path"]
            return f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}"
    
    return None


async def save_file_from_telegram(file_url: str, file_type: str) -> Optional[str]:
    """Download and save file from Telegram"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(file_url)
            file_data = response.content
        
        # Get filename from URL or use default
        filename = file_url.split("/")[-1] or f"file_{file_type}"
        
        result = save_encrypted_file(file_data, filename, f"{file_type}/*")
        return result["url"]
    except Exception as e:
        print(f"Error saving file from Telegram: {e}")
        return None


# ============================================================================
# Root and Health Check
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return JSONResponse({
        "message": "Advanced File Host API",
        "version": "1.0.0",
        "endpoints": {
            "web_ui": "/app",
            "upload": "/upload",
            "files": "/files",
            "telegram_webhook": "/telegram/webhook"
        }
    })


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse({"status": "ok"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
