#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    
    # Wait for debugger client if debugpy is available and runserver is called
    if 'runserver' in sys.argv:
        try:
            import debugpy
            debugpy.wait_for_client()
        except ImportError:
            pass  # debugpy not installed, continue normally
        except Exception:
            pass  # If wait fails, continue anyway
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
