from rest_framework import viewsets

from ..models import Expense
from ..pagination import StandardPagination
from ..serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by("-date", "-created_at")
    serializer_class = ExpenseSerializer
    pagination_class = StandardPagination
