# Copyright (c) Timur Iskhakov.


from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import render, get_object_or_404

from disk.models import File, Person
from ide.models import Editor


@login_required
def index(request, document):
    file = get_object_or_404(File, pk=document)
    person = Person.objects.get(user=request.user)

    if not file.editors.filter(pk=person.pk) and not file.viewers.filter(pk=person.pk):
        return HttpResponseForbidden()

    return render(request, 'ide.html', {'file': file})


@login_required
def get_file_context(request, document):
    file = get_object_or_404(File, pk=document)
    person = Person.objects.get(user=request.user)

    if not file.editors.filter(pk=person.pk) and not file.viewers.filter(pk=person.pk):
        return HttpResponseForbidden()

    try:
        editor = Editor.objects.get(file=file)
        return HttpResponse(editor.file_content)
    except ObjectDoesNotExist:
        return HttpResponse(file.file)
