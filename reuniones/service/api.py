"""Deploy behind TLS. Provision scoped device tokens out of band, never in public JS."""
import hashlib
import hmac
import json
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from store import Store, Conflict


def create_app(store=None, grants=None):
    store = store or Store(os.environ.get('MEETINGS_DATA', './private-meetings'))
    grants = grants if grants is not None else json.loads(os.environ.get('MEETINGS_GRANTS', '[]'))
    app = FastAPI(docs_url=None, redoc_url=None)
    origins = os.environ.get('MEETINGS_ORIGINS', 'http://localhost:8787').split(',')
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=['GET','POST','PUT'],
                       allow_headers=['Authorization','Content-Type','X-SHA256','X-Duration'], max_age=600)

    def auth(request):
        value = request.headers.get('authorization', '')
        if not value.startswith('Bearer '):
            raise HTTPException(401, 'authentication_required')
        digest = hashlib.sha256(value[7:].encode()).hexdigest()
        for g in grants:
            if hmac.compare_digest(digest, g['sha256']):
                return g
        raise HTTPException(401, 'invalid_device_token')

    def access(request, mid):
        g = auth(request)
        row = store.meeting(mid, g['owner'])
        if row['project'] not in g['projects']:
            raise HTTPException(403, 'project_not_authorized')
        return g

    @app.exception_handler(KeyError)
    async def missing(_, exc):
        return JSONResponse({'detail': 'not_found'}, status_code=404)

    @app.exception_handler(ValueError)
    async def invalid(_, exc):
        return JSONResponse({'detail': str(exc)}, status_code=409 if isinstance(exc, Conflict) else 400)

    @app.get('/health')
    def health():
        return {'ok': True, 'configured': bool(grants)}

    @app.post('/meetings/{mid}')
    async def create(mid: str, request: Request):
        g = auth(request)
        data = await bounded_json(request)
        if data.get('project') not in g['projects']:
            raise HTTPException(403, 'project_not_authorized')
        return store.create(mid, g['owner'], data['project'], data['mime'], data.get('format', 'stream'))

    @app.put('/meetings/{mid}/chunks/{seq}')
    async def put(mid: str, seq: int, request: Request):
        g = access(request, mid)
        data = bytearray()
        async for part in request.stream():
            data.extend(part)
            if len(data) > 32*1024*1024:
                raise HTTPException(413, 'chunk_too_large')
        return store.put(mid, g['owner'], seq, bytes(data), request.headers.get('x-sha256', ''), float(request.headers.get('x-duration', '0')))

    @app.post('/meetings/{mid}/finalize')
    async def finalize(mid: str, request: Request):
        g = access(request, mid)
        data = await bounded_json(request)
        return store.finalize(mid, g['owner'], data['manifest'], data.get('interrupted', False))

    @app.get('/meetings/{mid}')
    def status(mid: str, request: Request):
        g = access(request, mid)
        return store.status(mid, g['owner'])

    return app


async def bounded_json(request):
    data = bytearray()
    async for part in request.stream():
        data.extend(part)
        if len(data) > 8*1024*1024:
            raise HTTPException(413, 'request_too_large')
    return json.loads(data)


app = create_app()
