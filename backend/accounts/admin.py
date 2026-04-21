from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import ApiClientKey, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ('email',)
    list_display = ('email', 'name', 'role', 'scope', 'is_active', 'is_staff', 'otp_enabled')
    list_filter = ('role', 'scope', 'is_active', 'is_staff', 'otp_enabled')
    search_fields = ('email', 'name')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información personal', {'fields': ('name', 'role', 'scope', 'otp_enabled')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'role', 'scope', 'is_active', 'is_staff'),
        }),
    )


@admin.register(ApiClientKey)
class ApiClientKeyAdmin(admin.ModelAdmin):
    list_display = ('name', 'key_prefix', 'owner', 'is_active', 'last_used_at', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'key_prefix', 'owner__email')
    readonly_fields = ('key_prefix', 'key_hash', 'created_at', 'last_used_at')
