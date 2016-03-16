# Copyright (c) Timur Iskhakov.


from celery.contrib.methods import task_method
from celery import shared_task


class Docker:
    def __init__(self):
        pass

    @shared_task(filter=task_method, bind=True)
    def run(self):
        pass
