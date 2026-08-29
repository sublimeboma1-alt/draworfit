from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpResponse


def react_application(request, path=''):
    """Serve the React entry point for all frontend routes.

    API, admin, media and static routes are matched before this fallback.
    """
    index_file = Path(settings.FRONTEND_BUILD_DIR) / 'index.html'
    if not index_file.is_file():
        return HttpResponse(
            'Le frontend React n’est pas encore compilé. Lancez : npm.cmd --prefix frontend run build',
            status=503,
            content_type='text/plain; charset=utf-8',
        )
    return FileResponse(index_file.open('rb'), content_type='text/html; charset=utf-8')


def service_worker(request):
    """Serve the worker at the site root so it can control offline navigation."""
    worker_file = Path(settings.FRONTEND_BUILD_DIR) / 'sw.js'
    if not worker_file.is_file():
        return HttpResponse('Service worker unavailable.', status=404, content_type='text/plain; charset=utf-8')
    response = FileResponse(worker_file.open('rb'), content_type='application/javascript; charset=utf-8')
    response['Service-Worker-Allowed'] = '/'
    response['Cache-Control'] = 'no-cache'
    return response
