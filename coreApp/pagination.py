from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Default pagination for list endpoints.

    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            pagination_class = StandardPagination

    Client can override page size with ``?page_size=N`` (capped at 100).
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100
