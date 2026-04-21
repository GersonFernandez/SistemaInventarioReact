from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response(
            {'detail': 'Ha ocurrido un error interno inesperado.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(response.data, list):
        response.data = {'detail': response.data}
        return response

    if 'detail' not in response.data:
        response.data = {
            'detail': 'La solicitud no pudo procesarse.',
            'errors': response.data,
        }

    return response