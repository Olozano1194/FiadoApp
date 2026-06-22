from django.db.models import Q
from rest_framework import viewsets

from ..models import Client
from ..pagination import StandardPagination
from ..serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by("name")
    serializer_class = ClientSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = Client.objects.all().order_by("name")
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(phone__icontains=q) | Q(email__icontains=q))
        debt = self.request.query_params.get("debt")
        if debt == "true":
            qs = qs.filter(current_debt__gt=0)
        return qs
