from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .permissions import IsAdminRole
from .serializers import CustomTokenObtainPairSerializer, LogoutSerializer, PublicRegisterSerializer, UserCreateUpdateSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'


class RefreshView(TokenRefreshView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'


class RegisterView(CreateAPIView):
    serializer_class = PublicRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'


class MeView(RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Sesión cerrada y refresh token revocado.'}, status=status.HTTP_205_RESET_CONTENT)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.order_by('-date_joined')
    serializer_class = UserCreateUpdateSerializer
    permission_classes = [IsAdminRole]
    search_fields = ('email', 'name')
    filterset_fields = ('scope', 'role', 'is_active')
    ordering_fields = ('date_joined', 'email', 'name')

    def get_serializer_class(self):
        if self.action in {'list', 'retrieve'}:
            return UserSerializer
        return super().get_serializer_class()

    @action(detail=True, methods=['patch'], url_path='status')
    def status(self, request, pk=None):
        user = self.get_object()
        is_active = bool(request.data.get('is_active'))
        user.is_active = is_active
        user.save(update_fields=['is_active'])
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
