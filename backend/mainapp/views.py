from django.contrib.auth.models import User
from django.shortcuts import render
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Environment, Request
from .serializers import EnvironmentSerializer, RequestSerializer

# Create your views here.
@api_view(["POST"])
def signup(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def login(request):
    identifier = request.data.get('identifier')
    password = request.data.get('password')

    user = authenticate(username=identifier, password=password)

    if not user:
        try:
            user_obj = User.objects.get(email=identifier)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Login successful',
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_200_OK)

    return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

# ENVIRONMENT APIS
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def addEnv(request):
    serializer = EnvironmentSerializer(data=request.data)
    if serializer.is_valid():
        env = serializer.save()
        return Response({"message":"Added Successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getEnvs(request):
    envs = Environment.objects.all()
    serializer = EnvironmentSerializer(envs, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getSpecificEnv(request):
    var_name = request.GET.get("variable_name")
    try:
        env = Environment.objects.get(variable_name=var_name)
        serializer = EnvironmentSerializer(env)
        return Response(serializer.data)
    except Environment.DoesNotExist:
        return Response({"error": "Environment not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def updateEnv(request, id):
    try:
        env = Environment.objects.get(id=id)
    except Environment.DoesNotExist:
        return Response({"error": "Environment not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = EnvironmentSerializer(env, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "message":"Updated Successfully",
            "data":serializer.data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delEnv(request, id):
    try:
        env = Environment.objects.get(id=id)
        env.delete()
        return Response({"message": "Environment deleted"})
    except Environment.DoesNotExist:
        return Response({"error": "Environment not found"}, status=status.HTTP_404_NOT_FOUND)
    
# REQUESTS APIS
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def addRequest(request):
    serializer = RequestSerializer(data=request.data)
    if serializer.is_valid():
        req = serializer.save()
        return Response({"message":"Added Successfully"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getRequests(request):
    reqs = Request.objects.all()
    serializer = RequestSerializer(reqs, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getCollectedRequests(request):
    collected = Request.objects.filter(is_collected=True)
    serializer = RequestSerializer(collected, many=True)
    return Response(serializer.data)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def updateRequest(request, pk):
    try:
        req = Request.objects.get(pk=pk)
    except Request.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = RequestSerializer(req, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "message":"Updated Successfully",
            "data":serializer.data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def deleteRequest(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        req.delete()
        return Response({"message": "Request deleted"})
    except Request.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def getSpecificRequest(request, pk):
    try:
        req = Request.objects.get(pk=pk)
        serializer = RequestSerializer(req)
        return Response(serializer.data)
    except Request.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)
