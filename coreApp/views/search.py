from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Client, Product, Sale
from ..serializers import ClientSerializer, ProductSerializer, SaleSerializer


class SearchView(APIView):
    def get(self, request):
        q = request.query_params.get("q", "")
        if not q or len(q) < 2:
            return Response({"products": [], "clients": [], "sales": []})

        products = Product.objects.filter(
            Q(name__icontains=q) | Q(barcode__icontains=q)
        )[:10]
        clients = Client.objects.filter(name__icontains=q)[:10]
        sales = Sale.objects.filter(
            Q(client__name__icontains=q) | Q(id__icontains=q)
        ).select_related("client").prefetch_related("items__product")[:10]

        return Response(
            {
                "products": ProductSerializer(products, many=True).data,
                "clients": ClientSerializer(clients, many=True).data,
                "sales": SaleSerializer(sales, many=True).data,
            }
        )
