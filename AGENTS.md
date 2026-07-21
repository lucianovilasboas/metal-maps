# Portal de Regulamentos

Portal inteligente de navegação em documentos normativos institucionais
com mapa mental interativo.

## Stack

- **Backend**: Django 6 + DRF + SQLite + django-cors-headers + python-decouple
- **Frontend**: Vite 8 + React 19 + Tailwind CSS 4 + React Flow 12 + dagre
- **IA**: Gemini (`gemini-2.5-flash`) e OpenAI — configurável via `AI_PROVIDER`
- **Infra**: Docker Compose com healthcheck no backend

## Estrutura

```
mental-maps/
├── backend/              # Django API (config/, regulations/)
│   │                    # models: Documento, EstruturaBloco, Artigo, Paragrafo, Inciso, Alinea, Item, Disposicao
│   └── regulations/management/commands/  # import_json.py, seed_default.py
├── frontend/             # Vite + React
│   └── src/
│       ├── components/   # Header, Sidebar, MindMap, ArticleModal, ArticlePanel, UploadModal, TextUploadModal, Tooltip
│       └── api/client.js # base URL /api/v1, sem auth tokens
├── data/                 # JSONs de documentos
├── scripts/              # extract_pdf.py, transform_json.py
├── docker-compose.yml
└── .env                  # SECRET_KEY, DEBUG, AI_PROVIDER, GEMINI_API_KEY, OPENAI_API_KEY
```

## Comandos

### Docker

```bash
docker compose up -d --build    # backend :8039, frontend :5173
docker compose logs -f
docker compose down
docker compose exec backend python manage.py seed_default
docker compose exec backend python manage.py import_json /data/regulamento.json
```

O `up` já roda `migrate` + `seed_default` automaticamente. O healthcheck do backend
em `/api/v1/documentos/` controla a ordem de inicialização (frontend só sobe quando
backend estiver healthy).

### Local (sem Docker)

```bash
source .venv/bin/activate
cd backend && python manage.py runserver   # porta 8000

python scripts/extract_pdf.py data/meu_regulamento.pdf   # PDF → texto → IA → JSON
python scripts/transform_json.py                          # raw → formato do backend
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # :5173, proxy /api → localhost:8000 (sobrescrever com VITE_API_PROXY)
npm run build      # gera dist/
npm run lint       # oxlint
npm run preview    # preview da build
```

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/documentos/` | Lista documentos |
| GET | `/api/v1/documentos/<slug>/` | Detalhe com árvore de blocos e artigos |
| DELETE | `/api/v1/documentos/<slug>/delete/` | Exclui documento |
| POST | `/api/v1/documentos/upload-json/` | Importa JSON |
| POST | `/api/v1/documentos/upload-texto/` | Cola texto → IA estrutura → importa |
| PATCH | `/api/v1/documentos/<slug>/posicoes/` | Persiste posições dos nós no backend |
| GET | `/api/v1/artigos/<id>/` | Detalhe do artigo |
| GET | `/api/v1/buscar/?q=...&slug=...` | Busca textual (slug opcional) |

## Modelo de dados

Hierarquia: **Documento → EstruturaBloco → Artigo → Paragrafo → Inciso → Alinea → Item**

`EstruturaBloco` é uma árvore recursiva (self-FK) com 6 tipos: `parte`, `livro`,
`titulo`, `capitulo`, `secao`, `subsecao`. O upload JSON aceita a chave `"capitulos"`
em todos os pontos de entrada (`import_json`, `seed_default`, `upload-json`). A view
`upload_json` também aceita `"blocos"` como alternativa.

### Formato JSON esperado (upload / import_json)

```json
{
  "slug": "meu-regulamento",
  "titulo": "Meu Regulamento",
  "capitulos": [
    {
      "id": "cap-1",
      "titulo": "I - Nome do Capítulo",
      "artigos": [
        {
          "id": "art-1",
          "titulo": "Título do Artigo",
          "texto": "Conteúdo completo do artigo.",
          "relacionados": ["art-2"]
        }
      ]
    }
  ]
}
```

## Ambiente (.env)

```
SECRET_KEY=<valor>
DEBUG=True
AI_PROVIDER=gemini          # ou openai
GEMINI_API_KEY=<chave>
OPENAI_API_KEY=<chave>
```

## Regra de alterações

Frontend e backend são desacoplados (pastas, tech stacks e containers distintos).
**Toda mudança deve ser avaliada nos dois lados:**

- Mudança no **frontend** → verificar se a API precisa de novos endpoints ou campos.
- Mudança no **backend** → verificar se o contrato da API quebra algo no frontend.
- Alterações em contrato de API, nomes de rotas, formato de dados ou headers devem
  ser refletidas nos dois lados.

## Observações

- **Zero testes** no projeto — não existe `tests.py` nem `test*.py` em lugar nenhum.
- Linter do frontend é **oxlint** (não ESLint). Comando: `npm run lint`.
- Docker expõe backend na porta **8039** (host), não 8000.
- Tailwind CSS 4 usa plugin Vite (`@tailwindcss/vite`) — não existe `tailwind.config.js`.
- `INSTALLED_APPS` é mínimo: `django.contrib.auth`, `.contenttypes`, `.staticfiles`,
  `rest_framework`, `corsheaders`, `regulations`. Sem admin, sessions, messages.
- `CORS_ALLOW_ALL_ORIGINS = True` em dev.
- Dagre **é usado** no `MindMap.jsx` para layout do grafo de artigos.
- Dependências notáveis do frontend: `@tanstack/react-query`, `framer-motion`,
  `html-to-image` (export PNG), `react-dropzone`.
