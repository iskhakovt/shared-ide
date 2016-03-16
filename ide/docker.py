# Copyright (c) Timur Iskhakov.


from __future__ import absolute_import

from shared_ide.celery import app
from celery.contrib.methods import task_method


class Docker:
    def __init__(self):
        pass

    @app.task(filter=task_method, bind=True)
    def run(self):
        pass
