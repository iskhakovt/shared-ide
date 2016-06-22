# Shared IDE

## Installation
```bash
git clone https://github.com/iskhakovt/shared-ide.git
cd shared-ide
pip3 install -r requirements.txt # pip if you use Python 3 by default
npm install

./manage.py makemigrations
./manage.py migrate
./manage.py createsuperuser
```

## Running
```bash
redis-server
./manage.py runserver
```
