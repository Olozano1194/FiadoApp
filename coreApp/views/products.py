from django.db.models import F
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Product
from ..pagination import StandardPagination
from ..serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("name")
    serializer_class = ProductSerializer
    pagination_class = StandardPagination

    @action(detail=False, url_path="low-stock")
    def low_stock(self, request):
        """Return ALL products where stock is below min_stock (no pagination)."""
        products = Product.objects.filter(stock__lt=F("min_stock")).order_by("name")
        serializer = ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="lookup-barcode")
    def lookup_by_barcode(self, request):
        """Look up a product by its barcode."""
        barcode = request.query_params.get("barcode", "").strip()
        if not barcode:
            return Response({"error": "barcode parameter is required"}, status=400)
        try:
            product = Product.objects.get(barcode=barcode)
            serializer = ProductSerializer(product, context={"request": request})
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({"error": "Producto no encontrado"}, status=404)
