# Copyright (c) Timur Iskhakov.


from os import path
from subprocess import call


def build_jsx():
    for file in js_files:
        name, extension = path.splitext(path.basename(file))
        tmp = 'src/js/' + name + '-build.js'
        call([
            'babel',
            'src/js/' + file,
            '-o',
            tmp,
        ])

    for file in js_files:
        name, extension = path.splitext(path.basename(file))
        tmp = 'src/js/' + name + '-build.js'
        out = 'static/' + name + '.js'

        call([
            'browserify',
            tmp,
            '-o',
            out,
        ])


js_files = [
    'disk.jsx',
    'editor.js',
    'ide.jsx',
]
