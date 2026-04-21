from rest_framework.permissions import SAFE_METHODS, BasePermission


class ProductAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True

        user = request.user
        return bool(user and user.is_authenticated and user.scope == 'internal' and user.role in {'admin', 'operador'})


class SupplierAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.scope == 'internal' and user.role in {'admin', 'operador'})


class ReceptionAccessPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if request.method in SAFE_METHODS:
            return bool(user and user.is_authenticated and user.scope == 'internal')
        return bool(user and user.is_authenticated and user.scope == 'internal' and user.role in {'admin', 'operador'})