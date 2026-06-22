from datetime import datetime, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import FiadoPayment
from ..pagination import StandardPagination
from ..serializers import FiadoPaymentSerializer


class FiadoPaymentViewSet(viewsets.ModelViewSet):
    queryset = FiadoPayment.objects.all().order_by("-date")
    serializer_class = FiadoPaymentSerializer
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        payment = serializer.save()
        # Update client's current_debt
        if payment.client:
            payment.client.current_debt -= payment.amount
            payment.client.save(update_fields=["current_debt"])

    @action(detail=False)
    def today(self, request):
        """Return today's payment summary (total and count)."""
        today_start = timezone.make_aware(
            datetime.combine(timezone.localdate(), datetime.min.time())
        )
        today_end = today_start + timedelta(days=1)
        qs = FiadoPayment.objects.filter(date__range=(today_start, today_end))
        total = qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        count = qs.count()
        return Response({"total": str(total), "count": count})
