# Copyright (c) Timur Iskhakov.


import os
import react
import subprocess


def build_jsx():
    transformer = react.jsx.JSXTransformer()
    for file in jsx_files:
        dir_name = os.path.dirname(file)
        name, extension = os.path.splitext(os.path.basename(file))

        if extension != '.jsx':
            raise '{} is not a jsx file'.format(jsx_files)

        js_file = '{}/build/{}.js'.format(dir_name, name)
        js_min_file = '{}/build/{}.min.js'.format(dir_name, name)

        transformer.transform(file, js_file)

        subprocess.call([
            'yuicompressor',
            js_file,
            '-o',
            js_min_file,
        ])


jsx_files = [
    'static/disk.jsx',
]
