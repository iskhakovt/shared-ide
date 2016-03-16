# Copyright (c) Timur Iskhakov.


from django.shortcuts import render
from .docker import Docker


def index(request, document):
    docker = Docker()
    Docker.run.delay(docker)

    return render(request, 'ide.html')
