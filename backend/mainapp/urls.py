from django.urls import path
from .views import signup, login
from .views import addEnv, getEnvs, getSpecificEnv,updateEnv, delEnv

urlpatterns = [
    path('signup/', signup),
    path('login/', login),

    path('envs/add/', addEnv),
    path('envs/', getEnvs),
    path('envs/specific/', getSpecificEnv),
    path('envs/update/<int:id>/', updateEnv),
    path('envs/delete/<int:id>/', delEnv),
]