from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Documento, Capitulo, Artigo
from .serializers import (
    DocumentoListSerializer,
    DocumentoDetailSerializer,
    ArtigoSerializer,
)


@api_view(['GET'])
def listar_documentos(request):
    docs = Documento.objects.all()
    return Response(DocumentoListSerializer(docs, many=True).data)


@api_view(['GET'])
def detalhe_documento(request, slug):
    try:
        doc = Documento.objects.prefetch_related(
            'capitulos__artigos__relacionados'
        ).get(slug=slug)
    except Documento.DoesNotExist:
        return Response({'erro': 'Documento não encontrado'}, status=404)
    return Response(DocumentoDetailSerializer(doc).data)


@api_view(['GET'])
def detalhe_artigo(request, pk):
    try:
        artigo = Artigo.objects.prefetch_related('relacionados').get(pk=pk)
    except Artigo.DoesNotExist:
        return Response({'erro': 'Artigo não encontrado'}, status=404)
    return Response(ArtigoSerializer(artigo).data)


@api_view(['GET'])
def buscar(request):
    q = request.GET.get('q', '').strip()
    if not q:
        return Response({'resultados': []})

    artigos = Artigo.objects.filter(
        Q(texto__icontains=q) | Q(titulo__icontains=q) | Q(id_code__icontains=q)
    ).select_related('capitulo', 'capitulo__documento')

    resultados = []
    for a in artigos:
        resultados.append({
            'id': a.id,
            'id_code': a.id_code,
            'titulo': a.titulo,
            'texto_preview': a.texto[:200],
            'capitulo': a.capitulo.titulo,
            'documento': a.capitulo.documento.titulo,
            'documento_slug': a.capitulo.documento.slug,
        })

    return Response({'resultados': resultados})


@api_view(['POST'])
def upload_json(request):
    data = request.data
    titulo = data.get('titulo', 'Documento sem título')
    slug = data.get('slug', titulo.lower().replace(' ', '-').replace('ç', 'c').replace('ã', 'a').replace('õ', 'o')[:200])
    capitulos_data = data.get('capitulos', [])

    doc, created = Documento.objects.get_or_create(slug=slug, defaults={'titulo': titulo})
    if not created:
        doc.titulo = titulo
        doc.save()
        doc.capitulos.all().delete()

    for i, cap_data in enumerate(capitulos_data):
        cap = Capitulo.objects.create(
            documento=doc,
            id_code=cap_data.get('id', f'cap{i+1}'),
            titulo=cap_data.get('titulo', ''),
            ordem=i + 1,
        )
        for j, art_data in enumerate(cap_data.get('artigos', [])):
            artigo = Artigo.objects.create(
                capitulo=cap,
                id_code=art_data.get('id', f'art{j+1}'),
                titulo=art_data.get('titulo', ''),
                texto=art_data.get('texto', ''),
                ordem=j + 1,
            )

    for i, cap_data in enumerate(capitulos_data):
        for j, art_data in enumerate(cap_data.get('artigos', [])):
            id_code = art_data.get('id', f'art{j+1}')
            relacionados_ids = art_data.get('relacionados', [])
            if relacionados_ids:
                try:
                    artigo = Artigo.objects.get(capitulo__documento=doc, id_code=id_code)
                    for rel_id in relacionados_ids:
                        try:
                            rel = Artigo.objects.get(capitulo__documento=doc, id_code=rel_id)
                            artigo.relacionados.add(rel)
                        except Artigo.DoesNotExist:
                            pass
                except Artigo.DoesNotExist:
                    pass

    return Response(DocumentoDetailSerializer(doc).data, status=201 if created else 200)
