# Copyright (c) Timur Iskhakov.


from django.contrib import admin

from .models import Editor, EditOperation


class EditorAdmin(admin.ModelAdmin):
    list_display = ('file', 'sessions')


class EditOperationAdmin(admin.ModelAdmin):
    list_display = ('editor', 'action', 'user', 'session_id', 'change',)


admin.site.register(Editor, EditorAdmin)
admin.site.register(EditOperation, EditOperationAdmin)
