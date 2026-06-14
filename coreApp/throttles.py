from rest_framework.throttling import SimpleRateThrottle


class AuthLoginRateThrottle(SimpleRateThrottle):
    """Limita intentos de login a 10 por minuto."""
    scope = 'auth_login'

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            ident = self.get_ident(request)
        else:
            ident = request.user.pk
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class AuthChangePasswordRateThrottle(SimpleRateThrottle):
    """Limita cambios de contraseña a 5 por hora."""
    scope = 'auth_change_password'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return self.cache_format % {
                'scope': self.scope,
                'ident': request.user.pk,
            }
        return None
