# Copyright (c) Timur Iskhakov.


import hashlib
import json
from os import path
from subprocess import call


def hash_file(path):
    hasher = hashlib.md5()
    with open(path, 'rb') as afile:
        buf = afile.read()
        hasher.update(buf)

    return hasher.hexdigest()


class HashSaver:
    def __init__(self, hash_file):
        self.file_path = hash_file

        try:
            with open(self.file_path) as file:
                self.hashes = json.load(file)
        except FileNotFoundError:
            self.hashes = {}

    def get(self, key):
        return self.hashes[key] if key in self.hashes else None

    def insert(self, key, value):
        self.hashes[key] = value

    def flush(self):
        with open(self.file_path, 'w') as file:
            file.write(json.dumps(self.hashes))


def build_jsx():
    print('Building JS src...')

    saver = HashSaver(HASH_PATH)

    if all([hash_file('src/js/' + file) == saver.get(file) for file in JS_FILES]):
        print()
        return

    for file in JS_FILES:
        file_path = 'src/js/' + file
        name, extension = path.splitext(path.basename(file))
        tmp = 'src/js/' + name + '-build.js'

        call([
            'babel',
            file_path,
            '-o',
            tmp,
        ])

    for file in JS_FILES:
        file_path = 'src/js/' + file
        name, extension = path.splitext(path.basename(file))
        tmp = 'src/js/' + name + '-build.js'
        out = 'static/' + name + '.js'

        file_hash, saved_hash = hash_file(file_path), saver.get(file)
        saver.insert(file, file_hash)

        call([
            'browserify',
            tmp,
            '-o',
            out,
        ])

    saver.flush()
    print()


HASH_PATH = 'js_build_hash.json'

JS_FILES = [
    'disk.jsx',
    'editor.js',
    'ide.jsx',
    'socket.js',
    'new_file.jsx'
]
