from rest_framework import serializers
from .models import Documento, EstruturaBloco, Artigo, Paragrafo, Inciso, Alinea, Item, Disposicao


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'rotulo', 'texto', 'ordem']


class AlineaSerializer(serializers.ModelSerializer):
    itens = ItemSerializer(many=True, read_only=True)

    class Meta:
        model = Alinea
        fields = ['id', 'rotulo', 'texto', 'ordem', 'itens']


class IncisoSerializer(serializers.ModelSerializer):
    alineas = AlineaSerializer(many=True, read_only=True)

    class Meta:
        model = Inciso
        fields = ['id', 'rotulo', 'texto', 'ordem', 'alineas']


class ParagrafoSerializer(serializers.ModelSerializer):
    incisos = IncisoSerializer(many=True, read_only=True)

    class Meta:
        model = Paragrafo
        fields = ['id', 'rotulo', 'texto', 'ordem', 'incisos']


class ArtigoSerializer(serializers.ModelSerializer):
    relacionados = serializers.SerializerMethodField()
    paragrafos = ParagrafoSerializer(many=True, read_only=True)
    incisos = IncisoSerializer(many=True, read_only=True)

    class Meta:
        model = Artigo
        fields = ['id', 'id_code', 'titulo', 'texto', 'caput', 'ordem', 'relacionados', 'paragrafos', 'incisos']

    def get_relacionados(self, obj):
        return [{'id': r.id, 'id_code': r.id_code, 'titulo': r.titulo} for r in obj.relacionados.all()]


class EstruturaBlocoSerializer(serializers.ModelSerializer):
    artigos = ArtigoSerializer(many=True, read_only=True)
    filhos = serializers.SerializerMethodField()

    class Meta:
        model = EstruturaBloco
        fields = ['id', 'tipo', 'rotulo', 'titulo', 'ordem', 'artigos', 'filhos']

    def get_filhos(self, obj):
        qs = obj.filhos.all()
        return EstruturaBlocoSerializer(qs, many=True).data


class DisposicaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disposicao
        fields = ['id', 'tipo', 'texto', 'ordem']


class DocumentoListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ['id', 'titulo', 'slug', 'criado_em']


class DocumentoDetailSerializer(serializers.ModelSerializer):
    blocos = serializers.SerializerMethodField()
    disposicoes = DisposicaoSerializer(many=True, read_only=True)

    class Meta:
        model = Documento
        fields = ['id', 'titulo', 'slug', 'ementa', 'preambulo', 'criado_em', 'blocos', 'disposicoes', 'posicoes']

    def get_blocos(self, obj):
        qs = obj.blocos.filter(parent__isnull=True)
        return EstruturaBlocoSerializer(qs, many=True).data
