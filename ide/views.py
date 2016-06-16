# Copyright (c) Timur Iskhakov.


from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from .docker import Docker

from disk.models import *
from ide.models import *


@login_required
def index(request, document):
    file = get_object_or_404(File, pk=document)

    docker = Docker()
    docker.run.delay()

    return render(request, 'ide.html', {'file': file})
