from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

router.register(r'auth', views.AuthViewSet, basename='auth')
router.register(r'users', views.UserViewSet, basename='users')
router.register(r'customers', views.CustomerViewSet, basename='customers')
router.register(r'transactions', views.TransactionViewSet, basename='transactions')
router.register(r'settings', views.SettingsViewSet, basename='settings')

urlpatterns = [
    path('api/', include(router.urls)),
]