# Copyright (c) Timur Iskhakov.


from django.shortcuts import render


def index(request, document):
    return render(request, 'ide.html')
