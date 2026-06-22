from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import CashClosure
from ..pagination import StandardPagination
from ..serializers import CashClosureCreateSerializer, CashClosureSerializer
from .helpers import calculate_closure_data


class CashClosureViewSet(viewsets.ModelViewSet):
    queryset = CashClosure.objects.all().order_by("-date")
    serializer_class = CashClosureSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.action == "create":
            return CashClosureCreateSerializer
        if self.action == "preview":
            return CashClosureCreateSerializer
        return CashClosureSerializer

    def create(self, request, *args, **kwargs):
        """CashClosureCreateSerializer for input, CashClosureSerializer for output."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(created_by=request.user)
        out = CashClosureSerializer(instance, context=self.get_serializer_context())
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def preview(self, request):
        """Return a preview of today's closure without persisting it."""
        today = timezone.localdate()
        calcs = calculate_closure_data(today)

        data = {
            "date": today.isoformat(),
            "total_sales": str(calcs["total_sales"]),
            "cash_sales": str(calcs["cash_sales"]),
            "credit_sales": str(calcs["credit_sales"]),
            "sales_count": calcs["sales_count"],
            "fiado_payments": str(calcs["fiado_payments"]),
            "expenses": str(calcs["expenses"]),
            "net_profit": str(calcs["net_profit"]),
            "expected_cash": str(calcs["expected_cash"]),
        }

        # Check if a closure already exists for today
        try:
            existing = CashClosure.objects.get(date=today)
            data["already_closed"] = True
            data["last_closure"] = existing.created_at.isoformat()
            data["last_counted_cash"] = str(existing.counted_cash)
            data["last_discrepancy"] = str(existing.discrepancy)
        except CashClosure.DoesNotExist:
            data["already_closed"] = False

        return Response(data)
