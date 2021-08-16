from django.db import models
from django.contrib.auth.models import User

# All models are subclass of the django.db.models.Model class. 
# Each class will be transformed into database tables.
# Each field is represented by instances of django.db.models.Field subclasses (built-in Django core)
#  and will be translated into database columns.

class connections(models.Model):
    host = models.CharField(max_length=255)
    port = models.CharField(max_length=5)
    #socket = models.CharField(max_length=5)
    dbname = models.CharField(max_length=20)
    dbusr = models.CharField(max_length=100)
    dbpass = models.CharField(max_length=255)
    identifier = models.CharField(max_length=100)
    def __str__(self):
        return self.identifier