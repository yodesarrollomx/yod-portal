#!/usr/bin/env python3
"""Registro local de la App publicadora; no instala ni modifica repositorios."""
import argparse
import html
import json
import os
from pathlib import Path
import re
import secrets
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, urlopen

ORG = "yodesarrollomx"
REPOS = ["aurum-board", "sala-edicion"]
HOME = "https://yodesarrollomx.github.io/yod-portal/docs/arquitectura/"
PERMISSIONS = {"contents": "read", "pull_requests": "write"}
TTL = 1800


def manifest(origin):
    return {"name": "YOD Publicador yodesarrollomx", "url": HOME,
            "description": "Crea PR de Sala y Marketing conservando las revisiones obligatorias.",
            "public": False, "redirect_url": origin + "/callback",
            "hook_attributes": {"url": HOME, "active": False},
            "default_permissions": PERMISSIONS.copy(), "default_events": [],
            "request_oauth_on_install": False}


def private_directory(raw):
    """Crear directorio nuevo fuera de cualquier checkout, nunca reutilizar una ruta."""
    path = Path(raw).expanduser().absolute()
    if path.is_symlink():
        raise ValueError("No usar enlaces para guardar credenciales.")
    path = path.resolve()
    if any((parent / ".git").exists() for parent in [path, *path.parents]):
        raise ValueError("Las credenciales deben quedar fuera de cualquier repositorio.")
    path.mkdir(mode=0o700)  # El padre debe existir; una sesión nueva no pisa llaves.
    os.chmod(path, 0o700)
    return path


def exchange(code):
    request = Request("https://api.github.com/app-manifests/" + code + "/conversions",
                      method="POST", data=b"", headers={
                          "Accept": "application/vnd.github+json",
                          "X-GitHub-Api-Version": "2022-11-28",
                          "User-Agent": "YOD-publisher-registration"})
    with urlopen(request, timeout=25) as response:
        raw = response.read(131073)
        if len(raw) > 131072:
            raise ValueError("Respuesta demasiado grande.")
        return json.loads(raw)


def validate_app(data):
    if (type(data.get("id")) is not int or data["id"] <= 0
            or not re.fullmatch(r"[a-z0-9-]{1,100}", data.get("slug", ""))
            or data.get("owner", {}).get("login", "").lower() != ORG
            or data.get("owner", {}).get("type") != "Organization"):
        raise ValueError("Identidad de App inesperada.")
    permissions = {k: v for k, v in data.get("permissions", {}).items() if k != "metadata"}
    if (permissions != PERMISSIONS or data.get("permissions", {}).get("metadata", "read") != "read"
            or data.get("events", []) != []):
        raise ValueError("Permisos de App inesperados.")
    pem = data.get("pem", "")
    if not isinstance(pem, str) or not re.fullmatch(
            r"-----BEGIN (RSA )?PRIVATE KEY-----\n[A-Za-z0-9+/=\r\n]+\n-----END (RSA )?PRIVATE KEY-----\n?", pem):
        raise ValueError("Llave de App inesperada.")
    return {"app_id": data["id"], "slug": data["slug"], "owner": ORG,
            "repositories": REPOS, "permissions": PERMISSIONS, "installation_verified": False}, pem


def save_app(directory, metadata, pem):
    for name, value in [("private-key.pem", pem),
                        ("registration.json", json.dumps(metadata, indent=2) + "\n")]:
        fd = os.open(directory / name, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as stream:
            stream.write(value)


class Registration:
    def __init__(self, directory, converter=exchange, now=time.monotonic):
        self.directory = directory
        self.converter = converter
        self.now = now
        self.expires = now() + TTL
        self.state = secrets.token_urlsafe(32)
        self.used = False

    def finish(self, query):
        values = parse_qs(query, max_num_fields=4)
        states, codes = values.get("state", []), values.get("code", [])
        if (self.used or self.now() >= self.expires or len(states) != 1 or len(codes) != 1
                or not secrets.compare_digest(states[0], self.state)
                or not re.fullmatch(r"[a-fA-F0-9]{20,128}", codes[0])):
            raise ValueError("Respuesta caducada, usada o no reconocida.")
        self.used = True  # Nunca repetir conversión, incluso si falla la red.
        data = self.converter(codes[0])
        metadata, pem = validate_app(data)
        save_app(self.directory, metadata, pem)
        return "https://github.com/apps/" + metadata["slug"] + "/installations/new"


def handler_for(session):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # El callback contiene un código; no registrar rutas ni queries.

        def reply(self, status, body):
            raw = ("<!doctype html><html lang='es'><meta charset='utf-8'>"
                   "<meta name='viewport' content='width=device-width'><title>Publicador YOD</title>"
                   "<body><h1>Publicador YOD</h1>" + body + "</body></html>").encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'none'; form-action https://github.com; frame-ancestors 'none'; base-uri 'none'")
            self.end_headers()
            self.wfile.write(raw)

        def do_GET(self):
            origin = "http://127.0.0.1:" + str(self.server.server_port)
            if self.headers.get("Host") != origin.removeprefix("http://") or len(self.path) > 2048:
                self.reply(400, "<p>Solicitud no reconocida.</p>")
                return
            path = urlsplit(self.path)
            if path.path == "/" and not path.query:
                if session.used or session.now() >= session.expires:
                    self.reply(410, "<p>Sesión terminada. Consultar el registro local antes de crear otra App.</p>")
                    return
                value = html.escape(json.dumps(manifest(origin)), quote=True)
                self.reply(200, "<p>Crear una App privada, propiedad de <strong>yodesarrollomx</strong>.</p>"
                           "<ul><li>Leer contenido y crear PR; sin permisos de administración.</li>"
                           "<li>Sin webhooks ni autorización de tu cuenta para los trabajos automáticos.</li>"
                           "<li>Después selecciona únicamente <strong>sala-edicion</strong> y <strong>aurum-board</strong>.</li></ul>"
                           "<p>Este paso requiere tu consentimiento en GitHub. La llave se guarda localmente fuera del repositorio; no se muestra ni se envía por chat.</p>"
                           '<form method="post" action="https://github.com/organizations/' + ORG
                           + '/settings/apps/new?state=' + session.state + '"><input type="hidden" name="manifest" value="'
                           + value + '"><button>Revisar y crear en GitHub</button></form>')
            elif path.path == "/callback":
                try:
                    url = session.finish(path.query)
                except Exception:
                    # Ni HTTPError ni su cuerpo deben llegar a pantalla, stdout o logs.
                    self.reply(400, "<p>No se completó el registro. No repitas la creación: verifica primero en GitHub si la App ya existe y revisa el registro local.</p>")
                    return
                self.reply(200, '<p>App registrada. Falta instalarla: elige <strong>Only select repositories</strong> y solamente <strong>sala-edicion</strong> y <strong>aurum-board</strong>.</p><p><a href="'
                           + url + '">Instalar la App en GitHub</a></p><p>La automatización seguirá pendiente hasta comprobar los permisos, configurar los secretos y ejecutar sus revisiones.</p>')
                print("Registro guardado en directorio privado. Instalación y verificación pendientes.", flush=True)
            else:
                self.reply(404, "<p>No encontrado.</p>")

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", required=True, help="Directorio nuevo y privado fuera de git")
    args = parser.parse_args()
    try:
        directory = private_directory(args.output_dir)
        session = Registration(directory)
        server = HTTPServer(("127.0.0.1", 0), handler_for(session))
        server.timeout = 1
        print("Revisión y consentimiento: http://127.0.0.1:" + str(server.server_port) + "/", flush=True)
        print("Enlace local válido 30 minutos. No compartir credenciales.", flush=True)
        while session.now() < session.expires:
            server.handle_request()
        server.server_close()
    except KeyboardInterrupt:
        pass
    except Exception:
        print("No se pudo iniciar el registro. Verifica que el directorio sea nuevo, privado y fuera de git.", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
