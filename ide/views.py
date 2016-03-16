# Copyright (c) Timur Iskhakov.


from django.shortcuts import render
from .docker import Docker


def index(request, document):
    docker = Docker()
    docker.run.delay()

    return render(request, 'ide.html')
