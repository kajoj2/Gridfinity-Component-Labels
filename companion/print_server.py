#!/usr/bin/env python3
"""
Gridfinity Label Printer — brother_ql companion server
Listens on localhost:8099, accepts PNG images, prints to Brother QL via Wi-Fi/USB.

Usage:
  python print_server.py --printer tcp://192.168.1.XXX --model QL-810W

Requirements:
  pip install -r requirements.txt
"""

import argparse
import base64
import io
import json
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    from PIL import Image
    from brother_ql.raster import BrotherQLRaster
    from brother_ql.conversion import convert
    from brother_ql.backends.helpers import send
except ImportError:
    sys.exit("Missing dependencies — run: pip install -r requirements.txt")

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

args = None  # set in __main__


def print_label(png_bytes: bytes, label: str) -> None:
    img = Image.open(io.BytesIO(png_bytes)).convert('RGB')
    qlr = BrotherQLRaster(args.model)
    convert(qlr=qlr, images=[img], label=label, threshold=70, cut=True, rotate='auto')
    send(instructions=qlr.data, printer_identifier=args.printer, backend_identifier='network')


class Handler(BaseHTTPRequestHandler):

    def _send(self, code: int, body, ct: str = 'application/json') -> None:
        data = body.encode() if isinstance(body, str) else body
        self.send_response(code)
        self.send_header('Content-Type', ct)
        self.send_header('Content-Length', len(data))
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send(204, b'')

    def do_GET(self):
        if self.path == '/health':
            self._send(200, json.dumps({'ok': True, 'model': args.model, 'printer': args.printer}))
        else:
            self._send(404, json.dumps({'error': 'not found'}))

    def do_POST(self):
        if self.path != '/print':
            self._send(404, json.dumps({'error': 'not found'}))
            return
        length = int(self.headers.get('Content-Length', 0))
        try:
            payload = json.loads(self.rfile.read(length))
            img_bytes = base64.b64decode(payload['image'])
            label = str(payload.get('label', args.label))
            print_label(img_bytes, label)
            self._send(200, json.dumps({'ok': True}))
            print(f'✓ Printed on {label}mm tape')
        except Exception as exc:
            self._send(500, json.dumps({'error': str(exc)}))
            print(f'✗ Error: {exc}', file=sys.stderr)

    def log_message(self, fmt, *a):
        pass  # suppress default access log


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Gridfinity QL companion server')
    parser.add_argument('--printer', required=True,
                        help='Printer URL, e.g. tcp://192.168.1.XXX')
    parser.add_argument('--model', default='QL-810W',
                        help='Brother QL model (default: QL-810W)')
    parser.add_argument('--label', default='29',
                        help='Default label size: 29 (DK-2210) or 62 (DK-2205)')
    parser.add_argument('--port', type=int, default=8099,
                        help='Local HTTP port (default: 8099)')
    args = parser.parse_args()

    print(f'Gridfinity companion  →  {args.printer}  [{args.model}]')
    print(f'Listening on http://localhost:{args.port}')
    print('Ctrl+C to stop\n')

    try:
        HTTPServer(('localhost', args.port), Handler).serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
