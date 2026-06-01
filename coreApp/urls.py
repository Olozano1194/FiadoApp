from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from coreApp.serializers import CustomTokenObtainPairSerializer
from coreApp.views import (
    CategoryViewSet, ProductViewSet, ClientViewSet,
    SaleViewSet, FiadoPaymentViewSet,
    DashboardStatsView, SearchView,
    ReportStatsView, RecentActivityView,
    ChangePasswordView, ExportClientsView,
    ExportProductsView, ExportSalesView
)

#api versioning
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'fiado-payments', FiadoPaymentViewSet)

token_obtain_view = TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer)
token_obtain_view.permission_classes = [AllowAny]

token_refresh_view = TokenRefreshView.as_view()
token_refresh_view.permission_classes = [AllowAny]

token_verify_view = TokenVerifyView.as_view()
token_verify_view.permission_classes = [AllowAny]

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', token_obtain_view, name='token_obtain_pair'),
    path('api/token/refresh/', token_refresh_view, name='token_refresh'),
    path('api/token/verify/', token_verify_view, name='token_verify'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/search/', SearchView.as_view(), name='search'),
    path('api/reports/stats/', ReportStatsView.as_view(), name='reports-stats'),
    path('api/reports/recent-activity/', RecentActivityView.as_view(), name='reports-recent-activity'),
    path('api/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/export/clients/', ExportClientsView.as_view(), name='export-clients'),
    path('api/export/products/', ExportProductsView.as_view(), name='export-products'),
    path('api/export/sales/', ExportSalesView.as_view(), name='export-sales'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)