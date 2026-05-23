from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from coreApp.views import (
    CategoryViewSet, ProductViewSet, ClientViewSet,
    SaleViewSet, FiadoPaymentViewSet,
    DashboardStatsView, SearchView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'fiado-payments', FiadoPaymentViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/search/', SearchView.as_view(), name='search'),
]
