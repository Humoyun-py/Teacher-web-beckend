import json
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to automatically audit log write operations (POST, PUT, PATCH, DELETE)
    made by authenticated users (Admin/IT Support/Teachers).
    """

    def process_response(self, request, response):
        # Only log write operations for authenticated users
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE') and request.user and request.user.is_authenticated:
            # Exclude login and refresh endpoints from heavy payload logging (but log the login event separately)
            path = request.path
            if '/api/v1/auth/login/' in path or '/api/v1/auth/refresh/' in path:
                return response

            # Check if request succeeded or was created
            if response.status_code in (200, 201, 204):
                action_map = {
                    'POST': AuditLog.ActionType.CREATE,
                    'PUT': AuditLog.ActionType.UPDATE,
                    'PATCH': AuditLog.ActionType.UPDATE,
                    'DELETE': AuditLog.ActionType.DELETE,
                }
                
                # Determine target model and action description based on URL path
                path_parts = [p for p in path.split('/') if p]
                target_model = 'API Endpoint'
                if len(path_parts) > 2:
                    target_model = path_parts[2].capitalize() # e.g., 'teachers', 'lessons'
                
                # Don't duplicate logs if the view already logged it
                # We can check if an audit log entry was already created in this request cycle,
                # or keep it simple. Let's just create a generic request log.
                description = f"HTTP {request.method} request to {path}"
                
                # Try parsing request body safely
                req_data = None
                if request.method in ('POST', 'PUT', 'PATCH'):
                    try:
                        req_data = json.loads(request.body.decode('utf-8'))
                        # Redact password fields
                        if isinstance(req_data, dict):
                            for key in req_data.keys():
                                if 'password' in key.lower():
                                    req_data[key] = '******'
                    except Exception:
                        pass
                
                # Try parsing response body safely
                resp_data = None
                if response.status_code in (200, 201) and response.get('Content-Type') == 'application/json':
                    try:
                        resp_data = json.loads(response.content.decode('utf-8'))
                    except Exception:
                        pass

                # Create Audit Log record
                AuditLog.objects.create(
                    user=request.user,
                    action=action_map.get(request.method, AuditLog.ActionType.ADMIN_ACTION),
                    target_model=target_model[:100],
                    description=description,
                    old_data=req_data,
                    new_data=resp_data,
                    ip_address=request.META.get('REMOTE_ADDR'),
                )
        return response
