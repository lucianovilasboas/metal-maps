# Portal de Regulamentos

Portal inteligente de navegação em documentos normativos institucionais.

## Stack

- **Backend**: Django 6 + DRF + SQLite
- **Frontend**: Vite + React 18 + Tailwind CSS + React Flow
- **IA**: Google Gemini API (para estruturar texto)
- **Python**: gerenciado com `uv`

## Estrutura

```
mental-maps/
├── backend/              # Django API
│   ├── config/           # settings, urls
│   ├── regulations/      # models, views, serializers
│   │   └── management/commands/
│   │       └── import_json.py
│   └── manage.py
├── frontend/             # Vite + React
│   └── src/
│       ├── components/   # Header, Sidebar, MindMap, ArticlePanel, UploadModal
│       ├── api/client.js
│       └── App.jsx
├── data/                 # JSONs de exemplo/documentos
├── scripts/
│   └── extract_pdf.py    # PDF → texto → IA → JSON
└── AGENTS.md
```

## Comandos

### Backend

```bash
source .venv/bin/activate

# Rodar servidor
cd backend && python manage.py runserver

# Importar JSON
python manage.py import_json ../data/regulamento.json

# Extrair PDF (requer GEMINI_API_KEY no .env)
python ../scripts/extract_pdf.py ../data/meu_regulamento.pdf
```

### Build + Servir via Django

```bash
cd frontend
npm run build     # gera dist/ com assets compilados
```

O Django já está configurado para servir o `dist/` em produção.
Após todo `npm run build`, o frontend fica disponível na mesma
porta do backend (8000).

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/documentos/` | Lista documentos |
| GET | `/api/v1/documentos/<slug>/` | Detalhe com capítulos e artigos |
| POST | `/api/v1/documentos/upload-json/` | Importa JSON |
| GET | `/api/v1/artigos/<id>/` | Detalhe do artigo |
| GET | `/api/v1/buscar/?q=...` | Busca textual |

## Fluxo de trabalho

1. Colocar PDF do regulamento em `data/`
2. (opcional) Extrair com IA: `python scripts/extract_pdf.py data/regulamento.pdf`
3. Importar JSON: `python manage.py import_json data/regulamento.json`
4. Build do frontend: `cd frontend && npm run build`
5. Iniciar backend: `python manage.py runserver 0.0.0.0:8000`
6. Acessar `http://10.147.20.2:8000`

Ou: fazer upload do JSON diretamente pela interface (botão "+ Importar").
