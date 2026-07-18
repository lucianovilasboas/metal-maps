from rest_framework import serializers
from .models import Documento, Capitulo, Artigo


class ArtigoSerializer(serializers.ModelSerializer):
    relacionados = serializers.SerializerMethodField()

    class Meta:
        model = Artigo
        fields = ['id', 'id_code', 'titulo', 'texto', 'ordem', 'relacionados']

    def get_relacionados(self, obj):
        return [{'id': r.id, 'id_code': r.id_code, 'titulo': r.titulo} for r in obj.relacionados.all()]


class CapituloSerializer(serializers.ModelSerializer):
    artigos = ArtigoSerializer(many=True, read_only=True)

    class Meta:
        model = Capitulo
        fields = ['id', 'id_code', 'titulo', 'ordem', 'artigos']


class DocumentoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['id', 'titulo', 'slug', 'criado_em']


class DocumentoDetailSerializer(serializers.ModelSerializer):
    capitulos = CapituloSerializer(many=True, read_only=True)

    class Meta:
        model = Documento
        fields = ['id', 'titulo', 'slug', 'criado_em', 'capitulos']
