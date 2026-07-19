import json

from decouple import config
from django.db.models import Q
from google import genai as gemini_client
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Documento, EstruturaBloco, Artigo, Paragrafo, Inciso, Alinea, Item, Disposicao
from .serializers import (
    DocumentoListSerializer,
    DocumentoDetailSerializer,
    ArtigoSerializer,
)


def _criar_blocos_recursivo(doc, blocos_data, parent=None, artigos_list=None):
    for i, bloco_data in enumerate(blocos_data):
        bloco = EstruturaBloco.objects.create(
            documento=doc,
            parent=parent,
            tipo=bloco_data.get('tipo', 'capitulo'),
            rotulo=bloco_data.get('rotulo', ''),
            titulo=bloco_data.get('titulo', ''),
            ordem=i + 1,
        )

        for j, art_data in enumerate(bloco_data.get('artigos', [])):
            artigo = Artigo.objects.create(
                bloco=bloco,
                id_code=art_data.get('id', f'art{j+1}'),
                titulo=art_data.get('titulo', ''),
                texto=art_data.get('texto', ''),
                caput=art_data.get('caput', ''),
                ordem=j + 1,
            )

            for par_data in art_data.get('paragrafos', []):
                par = Paragrafo.objects.create(
                    artigo=artigo,
                    rotulo=par_data.get('rotulo', ''),
                    texto=par_data.get('texto', ''),
                    ordem=par_data.get('ordem', 0),
                )
                for inc_data in par_data.get('incisos', []):
                    inc = Inciso.objects.create(
                        paragrafo=par,
                        rotulo=inc_data.get('rotulo', ''),
                        texto=inc_data.get('texto', ''),
                        ordem=inc_data.get('ordem', 0),
                    )
                    for al_data in inc_data.get('alineas', []):
                        al = Alinea.objects.create(
                            inciso=inc,
                            rotulo=al_data.get('rotulo', ''),
                            texto=al_data.get('texto', ''),
                            ordem=al_data.get('ordem', 0),
                        )
                        for it_data in al_data.get('itens', []):
                            Item.objects.create(
                                alinea=al,
                                rotulo=it_data.get('rotulo', ''),
                                texto=it_data.get('texto', ''),
                                ordem=it_data.get('ordem', 0),
                            )

            for inc_data in art_data.get('incisos', []):
                Inciso.objects.create(
                    artigo=artigo,
                    rotulo=inc_data.get('rotulo', ''),
                    texto=inc_data.get('texto', ''),
                    ordem=inc_data.get('ordem', 0),
                )

            if artigos_list is not None:
                artigos_list.append(art_data)

        filhos = bloco_data.get('blocos', [])
        if filhos:
            _criar_blocos_recursivo(doc, filhos, parent=bloco, artigos_list=artigos_list)


def _criar_relacionados(doc, artigos_list):
    for art_data in artigos_list:
        id_code = art_data.get('id')
        relacionados_ids = art_data.get('relacionados', [])
        if not id_code or not relacionados_ids:
            continue
        if isinstance(relacionados_ids[0], dict):
            relacionados_ids = [r.get('id_code', str(r.get('id', ''))) for r in relacionados_ids]
        try:
            artigo = Artigo.objects.get(bloco__documento=doc, id_code=id_code)
            for rel_id in relacionados_ids:
                try:
                    rel = Artigo.objects.get(bloco__documento=doc, id_code=rel_id)
                    artigo.relacionados.add(rel)
                except Artigo.DoesNotExist:
                    pass
        except Artigo.DoesNotExist:
            pass


def _criar_disposicoes(doc, disposicoes_data):
    for i, disp_data in enumerate(disposicoes_data):
        Disposicao.objects.create(
            documento=doc,
            tipo=disp_data.get('tipo', 'gerais'),
            texto=disp_data.get('texto', ''),
            ordem=i + 1,
        )


@api_view(['GET'])
def listar_documentos(request):
    docs = Documento.objects.all()
    return Response(DocumentoListSerializer(docs, many=True).data)


@api_view(['GET'])
def detalhe_documento(request, slug):
    try:
        doc = Documento.objects.prefetch_related(
            'blocos__artigos__relacionados',
            'blocos__filhos__artigos__relacionados',
            'disposicoes',
        ).get(slug=slug)
    except Documento.DoesNotExist:
        return Response({'erro': 'Documento não encontrado'}, status=404)
    return Response(DocumentoDetailSerializer(doc).data)


@api_view(['GET'])
def detalhe_artigo(request, pk):
    try:
        artigo = Artigo.objects.prefetch_related(
            'relacionados', 'paragrafos__incisos__alineas__itens', 'incisos'
        ).get(pk=pk)
    except Artigo.DoesNotExist:
        return Response({'erro': 'Artigo não encontrado'}, status=404)
    return Response(ArtigoSerializer(artigo).data)


@api_view(['GET'])
def buscar(request):
    q = request.GET.get('q', '').strip()
    if not q:
        return Response({'resultados': []})

    slug = request.GET.get('slug', '').strip()

    filtro = Q(texto__icontains=q) | Q(titulo__icontains=q) | Q(id_code__icontains=q) | Q(caput__icontains=q)
    if slug:
        filtro &= Q(bloco__documento__slug=slug)

    artigos = Artigo.objects.filter(filtro).select_related('bloco', 'bloco__documento')

    resultados = []
    for a in artigos:
        bloco = a.bloco
        doc = bloco.documento
        resultados.append({
            'id': a.id,
            'id_code': a.id_code,
            'titulo': a.titulo,
            'texto_preview': a.texto[:200] or a.caput[:200],
            'capitulo': bloco.titulo,
            'documento': doc.titulo,
            'documento_slug': doc.slug,
        })

    return Response({'resultados': resultados})


@api_view(['POST'])
def upload_json(request):
    data = request.data
    titulo = data.get('titulo', 'Documento sem título')
    slug = data.get('slug', titulo.lower().replace(' ', '-').replace('ç', 'c').replace('ã', 'a').replace('õ', 'o')[:200])

    doc, created = Documento.objects.get_or_create(slug=slug, defaults={'titulo': titulo, 'preambulo': '', 'ementa': ''})
    if not created:
        doc.titulo = titulo
        doc.save()
        doc.blocos.all().delete()

    doc.ementa = data.get('ementa') or ''
    doc.preambulo = data.get('preambulo') or ''
    doc.save()

    blocos_data = data.get('blocos', data.get('capitulos', []))
    disposicoes_data = data.get('disposicoes', [])

    artigos_list = []
    _criar_blocos_recursivo(doc, blocos_data, artigos_list=artigos_list)
    if disposicoes_data:
        _criar_disposicoes(doc, disposicoes_data)

    if artigos_list:
        _criar_relacionados(doc, artigos_list)

    return Response(DocumentoDetailSerializer(doc).data, status=201 if created else 200)


@api_view(['PATCH'])
def atualizar_posicoes(request, slug):
    try:
        doc = Documento.objects.get(slug=slug)
    except Documento.DoesNotExist:
        return Response({'erro': 'Documento não encontrado'}, status=404)
    doc.posicoes = request.data.get('posicoes', {})
    doc.save()
    return Response({'status': 'ok'})


@api_view(['POST'])
def upload_texto(request):
    texto = request.data.get('texto', '')
    titulo = request.data.get('titulo', 'Documento importado')

    if not texto.strip():
        return Response({'erro': 'Texto não pode estar vazio'}, status=400)

    api_key = config('GEMINI_API_KEY', default=None)
    if not api_key:
        return Response({'erro': 'GEMINI_API_KEY não configurada'}, status=500)

    try:
        client = gemini_client.Client(api_key=api_key)

        prompt = f'''Você é um especialista em estruturação de documentos normativos brasileiros.
Receba o texto abaixo e converta para JSON seguindo este schema exato:

{{
  "slug": "identificador-url-amigavel",
  "titulo": "Título do Documento",
  "ementa": "Texto resumo do objeto da lei (se houver)",
  "preambulo": "Texto formal de autoridade que edita a norma (se houver)",
  "blocos": [
    {{
      "tipo": "parte",
      "rotulo": "PARTE I",
      "titulo": "Parte Geral",
      "blocos": [
        {{
          "tipo": "livro",
          "rotulo": "LIVRO I",
          "titulo": "Nome do Livro",
          "blocos": [
            {{
              "tipo": "titulo",
              "rotulo": "TÍTULO I",
              "titulo": "Nome do Título",
              "blocos": [
                {{
                  "tipo": "capitulo",
                  "rotulo": "CAPÍTULO I",
                  "titulo": "Nome do Capítulo",
                  "blocos": [
                    {{
                      "tipo": "secao",
                      "rotulo": "SEÇÃO I",
                      "titulo": "Nome da Seção",
                          "blocos": [
                            {{
                              "tipo": "subsecao",
                              "rotulo": "SUBSEÇÃO I",
                              "titulo": "Nome da Subseção",
                              "artigos": [
                                {{
                                  "id": "art-1",
                                  "rotulo": "Art. 1º",
                                  "titulo": "Objeto da Lei",
                                  "caput": "Esta Lei estabelece as normas...",
                                  "texto": "Texto completo do artigo (caput + paragrafos + incisos)",
                                  "paragrafos": [
                                    {{
                                      "rotulo": "§ 1º",
                                      "texto": "Texto do parágrafo.",
                                      "ordem": 1,
                                      "incisos": [
                                        {{
                                          "rotulo": "I",
                                          "texto": "Descrição do inciso.",
                                          "ordem": 1,
                                          "alineas": [
                                            {{
                                              "rotulo": "a)",
                                              "texto": "Texto da alínea.",
                                              "ordem": 1,
                                              "itens": [
                                                {{ "rotulo": "1.", "texto": "Texto do item.", "ordem": 1 }}
                                              ]
                                            }}
                                          ]
                                        }}
                                      ]
                                    }}
                                  ],
                                  "incisos": [],
                                  "relacionados": ["art-2"]
                                }}
                              ],
                              "blocos": []
                            }}
                          ]
                    }}
                  ]
                }}
              ]
            }}
          ]
        }}
      ]
    }}
  ],
  "disposicoes": [
    {{ "tipo": "gerais", "texto": "Texto das disposições gerais." }},
    {{ "tipo": "transitorias", "texto": "Texto das disposições transitórias." }},
    {{ "tipo": "finais", "texto": "Texto das disposições finais." }}
  ]
}}

REGRAS:
- Identifique a macroestrutura completa: Parte → Livro → Título → Capítulo → Seção → Subseção
- Use APENAS os níveis que existirem no texto (não invente)
- Extraia o caput (enunciado principal) de cada artigo separadamente
- Extraia parágrafos, incisos, alíneas e itens com seus respectivos textos
- Preserve o texto COMPLETO de cada dispositivo, sem resumos
- Relacione artigos que mencionam uns aos outros (use os IDs como "art-1")
- Cada artigo deve ficar DENTRO do bloco (parte/livro/titulo/capitulo/secao/subsecao)
  ao qual pertence, no campo "artigos" do respectivo bloco
- Se não houver título para o artigo, gere um resumo curto
- O slug deve ser uma versão URL-amigável do título
- Responda APENAS o JSON, sem explicações ou formatação extra

TEXTO:
{texto[:40000]}
'''

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )

        raw = response.text.strip()
        if raw.startswith('```json'):
            raw = raw[7:]
        if raw.startswith('```'):
            raw = raw[3:]
        if raw.endswith('```'):
            raw = raw[:-3]

        dados = json.loads(raw.strip())

    except Exception as e:
        return Response({'erro': f'Erro ao processar texto com IA: {str(e)}'}, status=500)

    if 'documentos' in dados:
        dados = dados['documentos'][0]

    slug = dados.get('slug', titulo.lower().replace(' ', '-').replace('ç', 'c').replace('ã', 'a').replace('õ', 'o')[:200])
    blocos_data = dados.get('blocos', dados.get('capitulos', []))
    disposicoes_data = dados.get('disposicoes', [])

    doc, created = Documento.objects.get_or_create(slug=slug, defaults={'titulo': titulo, 'preambulo': '', 'ementa': ''})
    if not created:
        doc.titulo = titulo
        doc.save()
        doc.blocos.all().delete()
        Disposicao.objects.filter(documento=doc).delete()

    doc.ementa = dados.get('ementa') or ''
    doc.preambulo = dados.get('preambulo') or ''
    doc.titulo = dados.get('titulo') or titulo or 'Documento importado'
    doc.save()

    artigos_list = []
    _criar_blocos_recursivo(doc, blocos_data, artigos_list=artigos_list)
    _criar_relacionados(doc, artigos_list)
    if disposicoes_data:
        _criar_disposicoes(doc, disposicoes_data)

    doc.refresh_from_db()
    return Response(DocumentoDetailSerializer(doc).data, status=201)
