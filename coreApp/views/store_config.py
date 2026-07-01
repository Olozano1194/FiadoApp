from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import StoreConfig


class StoreConfigView(APIView):

    def get_permissions(self):
        return [IsAuthenticated()]

    def get(self, request):
        config = StoreConfig.get_singleton()
        return Response({"store_name": config.store_name})

    def patch(self, request):
        config = StoreConfig.get_singleton()
        store_name = request.data.get("store_name", "").strip()
        if not store_name:
            return Response({"detail": "El nombre de la tienda no puede estar vacío"}, status=400)
        if len(store_name) > 200:
            return Response({"detail": "El nombre es muy largo (máx. 200 caracteres)"}, status=400)
        config.store_name = store_name
        config.save(update_fields=["store_name"])
        return Response({"store_name": config.store_name})
