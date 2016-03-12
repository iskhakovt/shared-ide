# Copyright (c) Timur Iskhakov.


from django.shortcuts import render


def index(request):
    return render(request, 'disk.html')
