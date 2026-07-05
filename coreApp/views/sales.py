from django.db import transaction
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Sale
from ..pagination import StandardPagination
from ..serializers import SaleCreateSerializer, SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by("-created_at")
    serializer_class = SaleSerializer
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return SaleCreateSerializer
        return SaleSerializer

    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        """Return recent completed sales."""
        limit = int(request.query_params.get("limit", 10))
        qs = (
            Sale.objects.filter(status="COMPLETED")
            .order_by("-created_at")
            .select_related("client")[:limit]
        )
        data = [
            {
                "id": sale.id,
                "cliente": sale.client.name if sale.client else "—",
                "hora": timezone.localtime(sale.created_at).strftime("%H:%M"),
                "estado": sale.get_status_display(),
                "total": str(sale.total),
            }
            for sale in qs
        ]
        return Response(data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Cancel a completed sale: restore stock, reduce client debt."""
        sale = self.get_object()
        if sale.status != Sale.Status.COMPLETED:
            return Response(
                {"detail": "Solo se pueden cancelar ventas completadas"},
                status=400,
            )
        with transaction.atomic():
            sale.status = Sale.Status.CANCELLED
            sale.save(update_fields=["status"])

            for item in sale.items.select_related("product"):
                item.product.stock += item.quantity
                item.product.save(update_fields=["stock"])

            if sale.payment_method == Sale.PaymentMethod.CREDIT and sale.client:
                sale.client.current_debt = max(0, sale.client.current_debt - sale.total)
                sale.client.save(update_fields=["current_debt"])

        return Response({"detail": "Venta cancelada correctamente"})

    @action(detail=False)
    def history(self, request):
        """Return sales. If ?client_id=N, filter by client + COMPLETED. Otherwise ALL sales."""
        client_id = request.query_params.get("client_id")
        if client_id:
            qs = Sale.objects.filter(client_id=client_id, status="COMPLETED").select_related("client").order_by("-created_at")
        else:
            qs = Sale.objects.all().order_by("-created_at").select_related("client")
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = SaleSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        return Response({"detail": "Parámetro page requerido para paginación"}, status=400)
