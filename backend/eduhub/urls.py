"""
URL configuration for eduhub project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def api_root(request):
    """Root API endpoint that shows available endpoints."""
    return JsonResponse({
        'message': 'EduHub API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'token_obtain': '/api/token/',
            'token_refresh': '/api/token/refresh/',
            'users': '/api/users/',
            'centers': '/api/centers/',
            'classes': '/api/class-groups/',
            'schedules': '/api/schedules/',
            'attendances': '/api/attendances/',
            'grades': '/api/grades/',
            'homeworks': '/api/homeworks/',
            'homework_submissions': '/api/homework-submissions/',
            'resources': '/api/resources/',
            'announcements': '/api/announcements/',
            'invoices': '/api/invoices/',
            'payments': '/api/payments/',
            'messages': '/api/messages/',
        },
        'documentation': 'Visit /api/ for detailed API documentation'
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
