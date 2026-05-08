from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    return Response({
        'auth': reverse('accounts:auth-root', request=request, format=format),
        'teachers': '/api/v1/teachers/',
        'lessons': '/api/v1/lessons/',
        'attendance': '/api/v1/attendance/',
        'photos': '/api/v1/photos/',
        'analytics': '/api/v1/analytics/',
        'notifications': '/api/v1/notifications/',
        'swagger': reverse('schema-swagger-ui', request=request, format=format),
    })
