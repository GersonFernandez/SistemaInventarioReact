from django.utils import timezone

from .models import ApiClientKey


def get_api_key_from_request(request):
    return request.headers.get('X-API-Key', '').strip()


def is_valid_api_key(raw_key):
    if not raw_key:
        return False
    key_hash = ApiClientKey.hash_key(raw_key)
    try:
        api_key = ApiClientKey.objects.select_related('owner').get(key_hash=key_hash, is_active=True)
    except ApiClientKey.DoesNotExist:
        return False
    api_key.last_used_at = timezone.now()
    api_key.save(update_fields=['last_used_at'])
    return True