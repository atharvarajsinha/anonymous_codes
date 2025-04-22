from django.urls import path
from .views import signup, login
from .views import addEnv, getEnvs, getSpecificEnv,updateEnv, delEnv
from .views import addRequest, getRequests, getCollectedRequests, updateRequest, deleteRequest, getSpecificRequest

urlpatterns = [
    path('signup/', signup),
    path('login/', login),

    path('envs/add/', addEnv),
    path('envs/', getEnvs),
    path('envs/specific/', getSpecificEnv),
    path('envs/update/<int:id>/', updateEnv),
    path('envs/delete/<int:id>/', delEnv),

    path('requests/add/', addRequest),
    path('requests/', getRequests),
    path('requests/collected/', getCollectedRequests),
    path('requests/specific/<int:pk>/', getSpecificRequest),
    path('requests/update/<int:pk>/', updateRequest),
    path('requests/delete/<int:pk>/', deleteRequest),
]