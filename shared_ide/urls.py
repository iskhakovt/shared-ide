# Copyright (c) Timur Iskhakov.


from django.conf.urls import url, include
from django.contrib import admin
from disk import views as disk_views
from ide import views as ide_views
from shared_ide import js_transform


js_transform.build_jsx()

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^disk/$', disk_views.index),
    url(r'^disk/files/$', disk_views.files),
    url(r'^disk/create_file/$', disk_views.create_file),
    url(r'^disk/delete_file/$', disk_views.delete_file),
    url(r'^disk/permissions/$', disk_views.get_permissions),
    url(r'^disk/edit_permissions/$', disk_views.delete_file),
    url(r'^ide/(?P<document>[a-zA-Z0-9]+)/$', ide_views.index),
    url(r'accounts/', include('django.contrib.auth.urls')),
]
