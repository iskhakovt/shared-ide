# Copyright (c) Timur Iskhakov.


from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.core.validators import validate_email
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.shortcuts import render, get_object_or_404, redirect

import json

from disk.models import File, Person, User, FILE_EXTENSIONS


def get_or_none(cls, **kwargs):
    try:
        return cls.objects.get(**kwargs)
    except cls.DoesNotExist:
        return None


def intro(request):
    return redirect(index)


@login_required
def index(request):
    context = {
        'user': request.user,
        'file_extensions': json.dumps(dict(FILE_EXTENSIONS))
    }

    return render(request, 'disk.html', context=context)


def get_users(request):
    if request.method != 'GET':
        return HttpResponseBadRequest()

    persons = Person.objects.all()
    response = [
        (person.id, {
            'username': person.user.username,
            'first_name': person.user.first_name,
            'last_name': person.user.last_name
        }) for person in persons
    ]

    return JsonResponse(dict(response))


@login_required
def get_files(request):
    person = Person.objects.get(user=request.user)

    def prepare_file(file, access):
        return (
            file.pk,
            {
                'name': file.name,
                'type': file.type,
                'creator_id': file.creator.pk,
                'last_modified': file.get_last_modified_date(),
                'access': access,
            }
        )

    def filter(objects, file_id):
        if file_id:
            try:
                return [objects.get(pk=file_id)]
            except ObjectDoesNotExist:
                return []
        else:
            return objects.all()

    file_id = request.GET['file_id'] if 'file_id' in request.GET else None

    response = []
    for file in filter(person.edit, file_id):
        response.append(prepare_file(file, 'edit'))
    for file in filter(person.view, file_id):
        response.append(prepare_file(file, 'view'))

    return JsonResponse(dict(response))


@login_required
def create_file(request):
    if 'name' not in request.POST or 'type' not in request.POST:
        return HttpResponseBadRequest()

    file = File.create_empty(request.POST['name'], request.POST['type'], request.user)

    if file:
        person = Person.objects.get(user=request.user)
        file.editors.add(person)
        file.save()

        return HttpResponse(status=201)
    else:
        return HttpResponseBadRequest()


def delete_file(request):
    if 'file_id' not in request.POST or not request.POST['file_id'].isdigit():
        return HttpResponseBadRequest()

    person = Person.objects.get(user=request.user)
    file = get_object_or_404(File, pk=request.POST['file_id'])

    if file.creator.pk != person.pk:
        return HttpResponseForbidden()

    file.delete()
    return HttpResponse()


def edit_permissions(request):
    required = ('file_id', 'user_id', 'access')
    for field in required:
        if field not in request.POST:
            return HttpResponseBadRequest()
    if not request.POST['file_id'].isdigit():
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

    file.editors.remove(person)
    file.viewers.remove(person)

    if request.POST['access'] == 'view':
        file.viewers.add(person)
    if request.POST['access'] == 'edit':
        file.editors.add(person)
    file.save()

    return HttpResponse()


def get_permissions(request):
    if 'file_id' not in request.GET:
        return HttpResponseBadRequest()
    if not request.GET['file_id'].isdigit():
        return HttpResponseBadRequest()

    person = Person.objects.get(user=request.user)
    file = get_object_or_404(File, pk=request.GET['file_id'])

    if not person.view.filter(pk=file.pk) and not person.edit.filter(pk=file.pk):
        return HttpResponseForbidden()

    view = list(map(lambda p: p.pk, file.viewers.all()))
    edit = list(map(lambda p: p.pk, file.editors.all()))

    return JsonResponse({'view': view, 'edit': edit})


def login_view(request):
    required = ('username', 'password')
    for field in required:
        if field not in request.POST:
            return HttpResponseBadRequest()

    user = authenticate(
        username=request.POST['username'],
        password=request.POST['password'],
    )

    if user:
        login(request, user)
        return HttpResponse(status=201)
    else:
        return HttpResponseBadRequest('incorrect')


def register_view(request):
    required = ('username', 'password', 'email', 'first_name', 'last_name')
    for field in required:
        if field not in request.POST:
            return HttpResponseBadRequest()

    try:
        validate_email(request.POST['email'])
    except ValidationError:
        return HttpResponseBadRequest('bad-email')

    if len(request.POST['password']) < 8:
        return HttpResponseBadRequest('bad-password')

    if get_or_none(User, username=request.POST['username']):
        return HttpResponseBadRequest('username-exists')

    User.objects.create_user(
        **{field: request.POST[field] for field in request.POST}
    )

    user = authenticate(
        username=request.POST['username'],
        password=request.POST['password'],
    )

    login(request, user)
    return HttpResponse(status=201)
