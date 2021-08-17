# python-mini-admin
A Simple, Minimal and Lightweight tool for quick and easy access to MySQL databases. Developed in python using Django framework.

## Steps to intall:
1. **Clone the project:** 
```
git clone https://github.com/patil-rahuls/python-mini-admin.git
```

2. **Create and Activate a virtual environment:**
```
virtualenv venv -p python3.6
source venv/bin/activate
```

3. **Install the project dependencies:**
```
pip install -r requirements.txt
```

4. **Add the _.env_:**  
Generate a secret key using `django.core.management.utils.get_random_secret_key()` (Please google for more info).  
In the same directory where manage.py exist, create a file `.env` and add the following info to it.
```
SECRET_KEY = _your_secret_key_
DEBUG=True
```

5. **Migrate changes:**
```
python manage.py migrate
```

7. **Create a project admin user:**
```
python manage.py createsuperuser
python manage.py makemigrations pythonminiadmin
python manage.py migrate

```

8. **Start the development server and run the app:**
```
python manage.py runserver
```

9. Open `localhost:8000` on your browser to view the app.

**_I hope this gets the app up and running on your machine. Let me know if you get stuck on any of these steps._**

## Troubleshooting:
- For Django Server Error: `port is already in use` you can free up the port using the following commands.
linux users: `sudo fuser -k 8000/tcp`
OSX users  : `sudo lsof -t -i tcp:8000 | xargs kill -9`

