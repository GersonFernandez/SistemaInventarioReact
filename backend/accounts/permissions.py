from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == 'admin')


class CanManageInventory(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and user.is_authenticated and user.scope == 'internal' and user.role in {'admin', 'operador'}
        )


class IsPublicOrInternalReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            user = request.user
            return not user or not user.is_authenticated or user.is_active
        user = request.user
        return bool(user and user.is_authenticated and user.scope == 'internal' and user.role in {'admin', 'operador'})