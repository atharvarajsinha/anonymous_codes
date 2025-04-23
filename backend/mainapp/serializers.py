from rest_framework import serializers
from .models import Environment, Request

class EnvironmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Environment
        fields = ['id', 'variable_name', 'value']

class RequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = ['id', 'request_method', 'request_name', 'request_url', 'is_collected']
