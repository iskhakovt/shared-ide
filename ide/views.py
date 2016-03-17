# Copyright (c) Timur Iskhakov.


from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .docker import Docker


@login_required
def index(request, document):
    docker = Docker()
    docker.run.delay()

    return render(request, 'ide.html')
