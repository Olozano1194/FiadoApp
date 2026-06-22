from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"detail": "old_password and new_password are required"}, status=400
            )

        if not user.check_password(old_password):
            return Response({"detail": "Contraseña actual incorrecta"}, status=400)

        if len(new_password) < 8:
            return Response({"detail": "La nueva contraseña debe tener al menos 8 caracteres"}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Contraseña actualizada correctamente"})
