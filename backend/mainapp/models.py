from django.db import models

# Create your models here.
class Environment(models.Model):
    variable_name = models.CharField(max_length=255, unique=True)
    value = models.TextField()

    def __str__(self):
        return self.variable_name
    
class Request(models.Model):
    request_method = models.CharField(max_length=10)
    request_name = models.CharField(max_length=255)
    request_url = models.URLField()
    is_collected = models.BooleanField(default=False)

    def __str__(self):
        return self.request_name
