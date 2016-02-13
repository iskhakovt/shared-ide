# Copyright (c) Timur Iskhakov.


from django.conf.urls import url
from django.contrib import admin

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    # url(r'^/', views.index),
]
