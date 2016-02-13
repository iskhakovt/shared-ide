# Copyright (c) Timur Iskhakov.


from django.contrib import admin

from .models import File, UserFiles


admin.site.register(File)
admin.site.register(UserFiles)
