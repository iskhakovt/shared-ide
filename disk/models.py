# Copyright (c) Timur Iskhakov.


from django.contrib.auth.models import User
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.db.models.signals import post_save
from django.utils import timezone


fs = FileSystemStorage(location='/shared')

FILE_EXTENSIONS = (
    ('cpp', 'C++'),
    ('py2', 'Python'),
    ('py3', 'Python3'),
)


class File(models.Model):
    name = models.CharField(max_length=30)
    type = models.CharField(max_length=3, choices=FILE_EXTENSIONS)
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    last_modified = models.DateTimeField()

    file = models.FileField(storage=fs)

    viewers = models.ManyToManyField(
        'Person', related_name='viewers', blank=True
    )
    editors = models.ManyToManyField(
        'Person', related_name='editors', blank=True
    )

    def get_full_name(self):
        return '{}.{} ({})'.format(self.name, self.type, self.creator.username)

    def get_last_modified_date(self):
        return self.last_modified.strftime('%b %d, %Y').replace(' 0', '0')

    def __str__(self):
        return self.get_full_name()

    @classmethod
    def create_empty(cls, name, type, creator):
        if type not in dict(FILE_EXTENSIONS):
            return None

        return cls.objects.create(
            name=name,
            type=type,
            creator=creator,
            last_modified=timezone.now()
        )


class Person(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    view = models.ManyToManyField(
        'File', related_name='view', through=File.viewers.through, blank=True
    )
    edit = models.ManyToManyField(
        'File', related_name='edit', through=File.editors.through, blank=True
    )

    def __str__(self):
        return self.user.username


def create_person(sender, instance, created, **kwargs):
    if created:
       profile, created = Person.objects.get_or_create(user=instance)


post_save.connect(create_person, sender=User)
