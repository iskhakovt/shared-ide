# Copyright (c) Timur Iskhakov.


from channels import Group
from channels.auth import channel_session_user, channel_session_user_from_http
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from django.utils import timezone

import json

from disk.models import File, Person
from ide.models import Editor, EditOperation


def on_start():
    for editor in Editor.objects.all():
        update_file(editor)


def update_file(editor):
    editor.file.file = editor.file_content
    editor.last_modified = editor.last_modified
    editor.file.save()
    editor.delete()


def insert(old, value, start_row, start_column):
    lines = old.split('\n')
    lines[start_row] = lines[start_row][:start_column] + value + lines[start_row][start_column:]
    return '\n'.join(lines)


def remove(old, start_row, start_column, end_row, end_column):
    lines = old.split('\n')

    if start_row == end_row:
        lines[start_row] = lines[start_row][:start_column] + lines[start_row][end_column:]
    else:
        lines[start_row] = lines[start_row][:start_column] + lines[end_row][end_column:]
        lines = lines[:start_row + 1] + lines[end_row + 1:]

    return '\n'.join(lines)


def perform_operation(document, op):
    file = get_object_or_404(File, pk=document)
    editor = get_object_or_404(Editor, file=file)

    op = json.loads(op)

    if 'action' not in op or 'user' not in op:
        return

    fields = ['change', 'start', 'end']
    for field in fields:
        if op['action'] == 'pass':
            op[field] = '0'

        if field not in op:
            return

    start_row = int(op['start']['row'])
    start_column = int(op['start']['column'])
    end_row = int(op['end']['row'])
    end_column = int(op['end']['column'])

    if op['action'] == 'insert':
        editor.file_content = insert(
            editor.file_content,
            op['change'],
            start_row,
            start_column
        )
    elif op['action'] == 'remove':
        editor.file_content = remove(
            editor.file_content,
            start_row,
            start_column,
            end_row,
            end_column
        )
    else:
        return

    timestamp = timezone.now()
    EditOperation.create(editor, op, timestamp)
    editor.last_modified = timestamp
    editor.save()


@channel_session_user_from_http
def ws_connect(message, document, id):
    file = get_object_or_404(File, pk=document)
    try:
        editor = Editor.objects.get(file=file)
    except ObjectDoesNotExist:
        editor = Editor.load(file)
    person = get_object_or_404(Person, user=message.user)

    if file.editors.filter(pk=person.pk):
        message.channel_session['room'] = editor.file.ws_group + 'edit'
    elif file.viewers.filter(pk=person.pk):
        message.channel_session['room'] = editor.file.ws_group + 'view'
    else:
        return

    editor.sessions += 1
    editor.save()

    Group(message.channel_session['room']).add(message.reply_channel)


@channel_session_user
def ws_message(message, document, id):
    if message.channel_session['room'].find('edit') != -1:
        Group(message.channel_session['room']).send({'text': message['text']})
        Group(message.channel_session['room'].replace('edit', 'view')).send({'text': message['text']})
        perform_operation(document, message['text'])


@channel_session_user
def ws_disconnect(message, document, id):

    file = get_object_or_404(File, pk=document)
    editor = get_object_or_404(Editor, file=file)

    editor.sessions -= 1
    editor.save()

    Group(message.channel_session['room']).discard(message.reply_channel)

    Group(message.channel_session['room']).send({'text': json.dumps({
        'action': 'disconnect',
        'id': id
    })})

    if editor.sessions == 0:
        update_file(editor)
