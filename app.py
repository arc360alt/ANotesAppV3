# app.py - Entry point for the A Notes App sync server
# Run with: python app.py

import socket
import logging
from flask import Flask
from flask_cors import CORS
from server.routes import register_routes

app = Flask(__name__)
CORS(app)

# Register all routes from server/routes.py
register_routes(app)


def get_server_ip():
    """Detect local network IP for display."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "localhost"


def port_in_use(port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result == 0
    except Exception:
        return False


if __name__ == '__main__':
    server_ip = get_server_ip()
    port = 2142

    print("=" * 50)
    print("  A Notes App — Sync Server")
    print("=" * 50)
    print(f"  Local:   http://localhost:{port}")
    print(f"  Network: http://{server_ip}:{port}")
    print(f"  Data:    ./data/")
    print("=" * 50)

    if port_in_use(port):
        print(f"⚠️  Port {port} is already in use!")
    else:
        print(f"✅ Port {port} is available")

    logging.basicConfig(level=logging.INFO)

    try:
        app.run(
            host='0.0.0.0',
            port=port,
            debug=True,
            use_reloader=False,
            threaded=True
        )
    except Exception as e:
        print(f"❌ Failed on port {port}: {e}")
        print("Trying port 8080...")
        try:
            app.run(host='0.0.0.0', port=8080, debug=True, use_reloader=False)
        except Exception as e2:
            print(f"❌ Port 8080 also failed: {e2}")
