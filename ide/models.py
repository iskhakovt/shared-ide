# Copyright (c) Timur Iskhakov.


from django.db import models

from disk.models import File, Person


class Editor(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE)
    file_content = models.TextField()
    last_modified = models.DateTimeField()
    sessions = models.IntegerField()

    @classmethod
    def load(cls, file):
        return cls.objects.create(
            file=file,
            file_content=file.file,
            last_modified=file.last_modified,
            sessions=0
        )


class EditOperation(models.Model):
    editor = models.ForeignKey(Editor, on_delete=models.CASCADE)
    user = models.ForeignKey(Person, on_delete=models.SET_NULL, null=True)
    session_id = models.CharField(max_length=32)

    action = models.CharField(max_length=6)
    change = models.TextField()
    start_row = models.IntegerField()
    start_column = models.IntegerField()
    end_row = models.IntegerField()
    end_column = models.IntegerField()

    timestamp = models.DateTimeField()

    @classmethod
    def create(cls, editor, op, timestamp):
        return cls.objects.create(
            editor=editor,
            action=op['action'],
            change=op['change'],
            start_row=op['start']['row'],
            start_column=op['start']['column'],
            end_row=op['end']['row'],
            end_column=op['end']['column'],
            user=Person.objects.get(pk=op['user']),
            session_id=op['id'],
            timestamp=timestamp
        )
