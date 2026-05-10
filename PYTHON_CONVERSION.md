# Advanced File Host - Python Conversion

This is a complete Python conversion of the original Cloudflare Worker JavaScript code to a FastAPI backend application.

## Features

- **Web UI** - Modern, responsive file upload interface at `/app`
- **File Encryption** - AES-256-GCM encryption for all uploaded files
- **Multiple File Types** - Support for images, videos, audio, and general files
- **Secure Storage** - Encrypted files stored locally with separate key management
- **Telegram Bot Integration** - Webhook support for Telegram bot file uploads
- **RESTful API** - Complete API for file operations
- **File Metadata** - Automatic tracking of file information and upload timestamps

## Project Structure

```
ballpwel/
├── main.py                      # Main FastAPI application
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Docker container configuration
├── docker-compose.yml          # Docker Compose setup
├── .env.example                # Environment variables template
├── PYTHON_CONVERSION.md        # This file
└── storage/                    # (Created at runtime)
    ├── files/                  # Encrypted file storage
    ├── keys/                   # Encryption keys
    └── metadata/               # File metadata
```

## Installation

### Option 1: Direct Python Installation

1. **Clone the repository**
   ```bash
   cd ballpwel
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

   The application will be available at `http://localhost:8000`

### Option 2: Docker Installation

1. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   The application will be available at `http://localhost:8000`

3. **View logs**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the application**
   ```bash
   docker-compose down
   ```

## API Endpoints

### Web Interface
- **GET `/app`** - Serve the web upload interface
  - Returns: HTML page with upload UI
  - Parameters: None
  - Example: `http://localhost:8000/app`

### File Operations
- **POST `/upload`** - Upload a new file
  - Parameters: `file` (multipart form data)
  - Returns: JSON with file metadata and URL
  - Example:
    ```bash
    curl -X POST -F "file=@myfile.pdf" http://localhost:8000/upload
    ```

- **GET `/files`** - List all uploaded files
  - Returns: JSON array of file metadata
  - Example: `http://localhost:8000/files`

- **GET `/file/{file_id}`** - Download a file (generic)
  - Parameters: `file_id` (path parameter)
  - Returns: File content with appropriate MIME type
  - Example: `http://localhost:8000/file/abc123def456`

- **GET `/image/{file_id}`** - Download an image
  - Parameters: `file_id` (path parameter)
  - Returns: Image file with image MIME type
  - Example: `http://localhost:8000/image/abc123def456`

- **GET `/video/{file_id}`** - Download a video
  - Parameters: `file_id` (path parameter)
  - Returns: Video file with video MIME type
  - Example: `http://localhost:8000/video/abc123def456`

- **GET `/audio/{file_id}`** - Download audio
  - Parameters: `file_id` (path parameter)
  - Returns: Audio file with audio MIME type
  - Example: `http://localhost:8000/audio/abc123def456`

### Telegram Bot
- **POST `/telegram/webhook`** - Telegram bot webhook
  - Parameters: JSON body with Telegram update
  - Returns: JSON response
  - Example: Configured in Telegram Bot API settings

### Health & Info
- **GET `/`** - API information
  - Returns: JSON with API details and available endpoints

- **GET `/health`** - Health check
  - Returns: JSON with status "ok"

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_OWNER_ID=6468293575

# API Configuration
API_BASE_URL=http://localhost:8000

# Server Configuration (optional)
HOST=0.0.0.0
PORT=8000
```

### Telegram Bot Setup

1. Create a bot with [@BotFather](https://t.me/botfather) on Telegram
2. Get your bot token
3. Set the webhook URL in your Telegram bot settings:
   ```bash
   curl -X POST "https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/telegram/webhook"}'
   ```

## File Encryption Details

### Encryption Algorithm
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 96 bits (12 bytes)
- **Authentication**: Built-in GCM authentication

### Storage Structure

Each uploaded file creates three files:

1. **Encrypted File** (`storage/files/{type}_{id}.enc`)
   - Contains encrypted file data
   - Format: JSON with `iv` and `data` arrays

2. **Encryption Key** (`storage/keys/key_{type}_{id}.json`)
   - Contains the encryption key in JWK format
   - Format: JSON with key parameters

3. **Metadata** (`storage/metadata/meta_{type}_{id}.json`)
   - Contains file information
   - Includes: name, MIME type, size, upload timestamp

### Security Considerations

- Each file gets a unique encryption key
- IVs are randomly generated for each encryption operation
- Keys are stored separately from encrypted data
- File metadata is stored in plain text (can be encrypted if needed)
- Consider implementing:
  - Key rotation policies
  - Access control lists
  - Audit logging
  - Backup encryption

## Web UI Features

### Upload Interface
- **Drag & Drop** - Drag files directly onto the dropzone
- **File Selection** - Click to browse and select files
- **Progress Tracking** - Visual progress bar during upload
- **Multiple File Types** - Support for all file types

### File Display
- **Image Preview** - Inline image preview for uploaded images
- **Video Player** - Embedded video player for video files
- **Audio Player** - Embedded audio player for audio files
- **Generic Files** - Display with appropriate file type icons
- **URL Sharing** - Copy file URL to clipboard with one click

### File Icons
- PDF files: 📄 PDF icon
- Word documents: 📝 Word icon
- Excel spreadsheets: 📊 Excel icon
- PowerPoint presentations: 📊 PowerPoint icon
- Archives (ZIP, RAR, 7Z): 📦 Archive icon
- Images: 🖼️ Image icon
- Videos: 🎬 Video icon
- Audio: 🎵 Audio icon
- Other files: 📄 File icon

## API Response Examples

### Upload Response
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_type": "image",
  "url": "http://localhost:8000/image/550e8400-e29b-41d4-a716-446655440000",
  "name": "photo.jpg",
  "type": "image/jpeg",
  "size": 245678
}
```

### Files List Response
```json
[
  {
    "url": "http://localhost:8000/image/550e8400-e29b-41d4-a716-446655440000",
    "name": "photo.jpg",
    "type": "image/jpeg",
    "size": 245678
  },
  {
    "url": "http://localhost:8000/video/660e8400-e29b-41d4-a716-446655440001",
    "name": "video.mp4",
    "type": "video/mp4",
    "size": 5245678
  }
]
```

### Error Response
```json
{
  "detail": "File not found"
}
```

## Deployment

### Production Deployment

1. **Use a production ASGI server**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

2. **Set up reverse proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Enable HTTPS** with Let's Encrypt
   ```bash
   certbot certonly --standalone -d your-domain.com
   ```

4. **Configure environment variables**
   - Set `API_BASE_URL` to your domain
   - Set Telegram bot token
   - Configure storage location

### Scaling Considerations

- **Storage**: Consider using cloud storage (S3, Azure Blob) for scalability
- **Database**: Add database for metadata management
- **Caching**: Implement caching for frequently accessed files
- **Load Balancing**: Use load balancer for multiple instances
- **Key Management**: Use dedicated key management service (AWS KMS, etc.)

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
```

### Permission Denied on Storage Directory
```bash
chmod -R 755 storage/
```

### Telegram Webhook Not Working
1. Check bot token is correct
2. Verify webhook URL is publicly accessible
3. Check firewall/security group settings
4. Test webhook with:
   ```bash
   curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-domain.com/telegram/webhook"}'
   ```

### Files Not Persisting
- Check storage directory permissions
- Verify disk space availability
- Check application logs for errors

## Development

### Running Tests
```bash
pip install pytest pytest-asyncio
pytest
```

### Code Quality
```bash
pip install black flake8
black main.py
flake8 main.py
```

## Migration from JavaScript Version

### Key Changes

1. **Routing**: `/app` endpoint now serves the web UI
2. **File Storage**: Uses local filesystem instead of Cloudflare KV
3. **Encryption**: Python cryptography library (compatible with original)
4. **Async**: FastAPI uses async/await for better performance
5. **Configuration**: Environment variables instead of Cloudflare env

### Compatibility

- File format is compatible with original JavaScript version
- Encryption keys can be migrated between versions
- API responses maintain same structure

## License

This project is a conversion of the original Cloudflare Worker code to Python.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Check API endpoint responses
4. Verify environment configuration

## Changelog

### Version 1.0.0 (Initial Release)
- Complete Python conversion from JavaScript
- FastAPI backend implementation
- AES-256-GCM encryption
- Web UI with modern interface
- Telegram bot integration
- Docker support
- Comprehensive documentation
