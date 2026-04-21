import bleach
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


def sanitize_text(value):
    return bleach.clean(value or '', strip=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'role', 'scope', 'is_active', 'otp_enabled', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'password', 'role', 'scope', 'is_active', 'otp_enabled')
        read_only_fields = ('id',)

    def validate_name(self, value):
        return sanitize_text(value)

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class PublicRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'password')
        read_only_fields = ('id',)

    def validate_name(self, value):
        return sanitize_text(value)

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            scope=User.Scope.PUBLIC,
            role=User.Role.VIEWER,
        )


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        credentials = {
            'email': attrs.get('email'),
            'password': attrs.get('password'),
        }
        user = authenticate(request=self.context.get('request'), **credentials)
        if not user:
            raise serializers.ValidationError({'detail': 'Credenciales inválidas.'})
        if not user.is_active:
            raise serializers.ValidationError({'detail': 'La cuenta está bloqueada.'})
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def save(self, **kwargs):
        refresh_token = self.validated_data['refresh']
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as exc:
            raise serializers.ValidationError({'detail': f'Token inválido o expirado: {str(exc)}'})