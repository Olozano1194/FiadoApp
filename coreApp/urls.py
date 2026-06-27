from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework.throttling import UserRateThrottle
from coreApp.serializers import CustomTokenObtainPairSerializer
from coreApp.throttles import AuthLoginRateThrottle
from coreApp.views import (
    HealthCheckView, CategoryViewSet, ProductViewSet, ClientViewSet,
    SaleViewSet, FiadoPaymentViewSet, ExpenseViewSet, CashClosureViewSet,
    DashboardStatsView, SearchView,
    ReportStatsView, RecentActivityView,
    ChangePasswordView, ExportClientsView,
    ExportExpensesView, ExportProductsView, ExportSalesView,
    ExportDbView, ImportDbView, BackupConfigView,
    CloudBackupUploadView, CloudBackupListView, CloudBackupRestoreView,
)

#api versioning
router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'fiado-payments', FiadoPaymentViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'cash-closures', CashClosureViewSet)

auth_throttles = [AuthLoginRateThrottle]
auth_user_throttles = [UserRateThrottle, AuthLoginRateThrottle]

token_obtain_view = TokenObtainPairView.as_view(
    serializer_class=CustomTokenObtainPairSerializer,
)
token_obtain_view.permission_classes = [AllowAny]
token_obtain_view.throttle_classes = auth_throttles

token_refresh_view = TokenRefreshView.as_view()
token_refresh_view.permission_classes = [AllowAny]
token_refresh_view.throttle_classes = auth_throttles

token_verify_view = TokenVerifyView.as_view()
token_verify_view.permission_classes = [AllowAny]
token_verify_view.throttle_classes = auth_throttles

urlpatterns = [
    # Public health-check root — MUST go BEFORE router include so /api/ matches first
    path('api/', HealthCheckView.as_view(), name='health-check'),
    path('api/', include(router.urls)),
    path('api/token/', token_obtain_view, name='token_obtain_pair'),
    path('api/token/refresh/', token_refresh_view, name='token_refresh'),
    path('api/token/verify/', token_verify_view, name='token_verify'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/search/', SearchView.as_view(), name='search'),
    path('api/reports/stats/', ReportStatsView.as_view(), name='reports-stats'),
    path('api/reports/recent-activity/', RecentActivityView.as_view(), name='reports-recent-activity'),
    path('api/change-password/', ChangePasswordView.as_view(
        throttle_classes=auth_user_throttles,
    ), name='change-password'),
    path('api/export/clients/', ExportClientsView.as_view(), name='export-clients'),
    path('api/export/products/', ExportProductsView.as_view(), name='export-products'),
    path('api/export/sales/', ExportSalesView.as_view(), name='export-sales'),
    path('api/export/expenses/', ExportExpensesView.as_view(), name='export-expenses'),
    path('api/backup/export/', ExportDbView.as_view(), name='backup-export'),
    path('api/backup/import/', ImportDbView.as_view(), name='backup-import'),
    path('api/backup/config/', BackupConfigView.as_view(), name='backup-config'),
    path('api/backup/cloud/upload/', CloudBackupUploadView.as_view(), name='cloud-backup-upload'),
    path('api/backup/cloud/list/', CloudBackupListView.as_view(), name='cloud-backup-list'),
    path('api/backup/cloud/restore/<str:filename>/', CloudBackupRestoreView.as_view(), name='cloud-backup-restore'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)