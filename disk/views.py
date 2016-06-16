# Copyright (c) Timur Iskhakov.


from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.shortcuts import render, get_object_or_404

import json

from disk.models import *


@login_required
def index(request):
    context = {
        'user': request.user,
        'file_extensions': json.dumps(dict(FILE_EXTENSIONS))
    }

    return render(request, 'disk.html', context=context)


@login_required
def files(request):
    person = Person.objects.get(user=request.user)

    ret = []
    for file in person.edit.all():
        ret.append({
            'id': file.pk,
            'name': file.name,
            'type': file.type,
            'creator': file.creator.username,
            'last_modified': file.get_last_modified_date(),
            'access': 'edit',
        })
    for file in person.view.all():
        ret.append({
            'id': file.pk,
            'name': file.get_full_name(),
            'type': file.type,
            'creator': file.creator.username,
            'last_modified': file.get_last_modified_date(),
            'access': 'view',
        })

    return JsonResponse({'files': ret})


@login_required
def create_file(request):
    if 'name' not in request.POST or 'type' not in request.POST:
        return HttpResponseBadRequest()

    file = File.create_empty(request.POST['name'], request.POST['type'], request.user)

    if file:
        person = Person.objects.get(user=request.user)
        file.editors.add(person)
        person.save()

        return HttpResponse(status=201)
    else:
        return HttpResponseBadRequest()


def delete_file(request):
    if 'file_id' not in request.POST:
        return HttpResponseBadRequest()

    person = Person.objects.get(user=request.user)
    file = get_object_or_404(File, pk=request.POST['file_id'])

    if file.creator.pk != person.pk:
        return HttpResponseForbidden()

    file.delete()
    return HttpResponse()


def edit_permissions(request):
    if 'file_id' not in request.POST or\
            'user_id' not in request.POST or\
            'access' not in request.POST:
        return HttpResponseBadRequest()

    if request.POST['access'] not in ('none', 'view', 'edit'):
        return HttpResponseBadRequest()

    person = Person.objects.get(user=request.user)
    file = get_object_or_404(File, pk=request.POST['file_id'])

    if not person.edit.filter(pk=file.pk):
        return HttpResponseForbidden()

    person = Person.objects.get(user=get_object_or_404(User, pk=request.POST['user_id']))

    if person.pk == file.creator.pk:
        HttpResponseBadRequest()

    view_instance = person.view.filter(pk=file.pk)
    if view_instance:
        view_instance.delete()
    edit_instance = person.view.filter(pk=file.pk)
    if edit_instance:
        edit_instance.delete()

    if request.POST['access'] == 'view':
        file.viewers.add(person=person)
    if request.POST['access'] == 'edit':
        file.editors.add(person=person)

    return HttpResponse()


def get_permissions(request):
    if 'file_id' not in request.GET:
        return HttpResponseBadRequest()

    person = Person.objects.get(user=request.user)
    file = get_object_or_404(File, pk=request.POST['file_id'])

    if not person.view.filter(pk=file.pk) and not person.edit.filter(pk=file.pk):
        return HttpResponseForbidden()

    view = list(map(lambda p: (p.id, p.name), file.viewers.all()))
    edit = list(map(lambda p: (p.id, p.name), file.viewers.all()))

    return JsonResponse({'view': view, 'edit': edit})
