"""
Extrai texto de um PDF de regulamento e usa IA (Gemini) para estruturar
em JSON no schema do Portal de Regulamentos.

Uso:
    python scripts/extract_pdf.py data/regulamento.pdf

Requer a variável de ambiente GEMINI_API_KEY ou um arquivo .env com:
    GEMINI_API_KEY=sua_chave
"""
import json
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

from decouple import config
from pypdf import PdfReader
from google import genai


def extrair_texto_pdf(caminho):
    reader = PdfReader(caminho)
    texto = []
    for pagina in reader.pages:
        conteudo = pagina.extract_text()
        if conteudo:
            texto.append(conteudo)
    return '\n'.join(texto)


def estruturar_com_ia(texto, titulo_sugerido='Documento'):
    api_key = config('GEMINI_API_KEY', default=None)
    if not api_key:
        raise RuntimeError(
            'GEMINI_API_KEY não encontrada. '
            'Configure no .env ou exporte a variável.'
        )

    client = genai.Client(api_key=api_key)

    prompt = f'''Você é um especialista em estruturação de documentos normativos.
Receba o texto abaixo e converta para JSON seguindo este schema exato:

{{
  "documentos": [
    {{
      "slug": "identificador-url-amigavel",
      "titulo": "{titulo_sugerido}",
      "capitulos": [
        {{
          "id": "cap1",
          "titulo": "Nome do Capítulo ou 'Sem capítulo'",
          "artigos": [
            {{
              "id": "art1",
              "titulo": "Título ou resumo do artigo",
              "texto": "Texto completo do artigo",
              "relacionados": ["art2", "art5"]
            }}
          ]
        }}
      ]
    }}
  ]
}}

REGRAS:
- Identifique capítulos e artigos no texto
- Preserve o texto COMPLETO de cada artigo, sem resumos
- Relacione artigos que mencionam uns aos outros
- Se não houver capítulos, coloque tudo em um único capítulo
- Se não houver título para o artigo, gere um resumo curto
- O slug deve ser uma versão URL-amigável do título
- Responda APENAS o JSON, sem explicações ou formatação extra

TEXTO:
{texto[:30000]}
'''

    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents=prompt,
    )

    raw = response.text.strip()
    if raw.startswith('```json'):
        raw = raw[7:]
    if raw.startswith('```'):
        raw = raw[3:]
    if raw.endswith('```'):
        raw = raw[:-3]

    return json.loads(raw.strip())


def main():
    if len(sys.argv) < 2:
        print('Uso: python scripts/extract_pdf.py <caminho_do_pdf>', file=sys.stderr)
        sys.exit(1)

    caminho = sys.argv[1]
    print(f'📄 Lendo PDF: {caminho}')
    texto = extrair_texto_pdf(caminho)
    print(f'✅ Texto extraído: {len(texto)} caracteres')

    titulo = Path(caminho).stem.replace('_', ' ').replace('-', ' ').title()
    print(f'🤖 Estruturando com IA...')
    dados = estruturar_com_ia(texto, titulo)

    output = Path(caminho).with_suffix('.json')
    with open(output, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

    print(f'✅ JSON salvo em: {output}')
    print(f'📊 Documentos: {len(dados.get("documentos", []))}')
    for doc in dados.get('documentos', []):
        caps = len(doc.get('capitulos', []))
        arts = sum(len(c.get('artigos', [])) for c in doc.get('capitulos', []))
        print(f'   {doc["titulo"]}: {caps} capítulos, {arts} artigos')


if __name__ == '__main__':
    main()
