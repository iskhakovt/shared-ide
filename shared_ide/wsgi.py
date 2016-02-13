# Copyright (c) Timur Iskhakov.


import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shared_ide.settings")

application = get_wsgi_application()
