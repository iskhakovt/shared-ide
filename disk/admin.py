# Copyright (c) Timur Iskhakov.


from django.contrib import admin

from .models import Person, File


class FileAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'creator', 'last_modified')
    list_filter = ('last_modified',)


admin.site.register(Person)
admin.site.register(File, FileAdmin)
