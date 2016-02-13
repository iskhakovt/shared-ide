# Copyright (c) Timur Iskhakov.


from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.files.storage import FileSystemStorage


fs = FileSystemStorage(location='/shared')

FILE_EXTENSIONS = (
    ('c', 'C'),
    ('cpp', 'C++'),
    ('py', 'Python'),
    ('py3', 'Python3'),
    ('tex', 'LaTeX'),
    ('pdf', 'PDF'),
)


class File(models.Model):
    name = models.CharField(max_length=30)
    type = models.CharField(max_length=3, choices=FILE_EXTENSIONS)
    # creator = models.ForeignKey(User)
    # editors = models.ManyToManyField(User)

    # lots of stuff is coming
    # creation_time = models.DateField(default=timezone.now)

    def get_full_name(self):
        return self.name + '.' + self.type

    file = models.FileField(storage=fs)

    def __str__(self):
        return self.get_full_name()


class UserFiles(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    files = models.ManyToManyField(File)

    def __str__(self):
        return '{}: {{{}}}'.format(
            self.user.get_full_name(),
            ', '.join(map(lambda file: file.get_full_name(), self.files.all()))
        )
