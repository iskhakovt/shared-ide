# Copyright (c) Timur Iskhakov.


from django.conf.urls import url
from django.contrib import admin
from disk import views as disk_views
from ide import views as ide_views
from shared_ide import js_transform


js_transform.build_jsx()

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^disk/', disk_views.index),
    url(r'^ide/', ide_views.index),
]
