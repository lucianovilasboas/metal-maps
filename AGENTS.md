# Portal de Regulamentos

Portal inteligente de navegação em documentos normativos institucionais
com mapa mental interativo.

## Stack

- **Backend**: Django 6 + DRF + SQLite
- **Frontend**: Vite + React 19 + Tailwind CSS 4 + React Flow 12 + dagre
- **IA**: Google Gemini API (para estruturar texto)
- **Infra**: Docker Compose (Dockerfile pra cada serviço)

## Estrutura

```
mental-maps/
├── backend/              # Django API
│   ├── config/           # settings, urls
│   ├── regulations/      # models, views, serializers
│   │   └── management/commands/
│   │       ├── import_json.py
│   │       └── seed_default.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/             # Vite + React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx         # Barra superior com busca + importar
│   │   │   ├── Sidebar.jsx        # Árvore de capítulos (esquerda)
│   │   │   ├── MindMap.jsx        # Mapa mental radial (centro)
│   │   │   ├── ArticleModal.jsx   # Modal de artigo ao clicar
│   │   │   ├── UploadModal.jsx    # Upload de JSON
│   │   │   └── TextUploadModal.jsx# Colar texto com IA
│   │   ├── api/client.js
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── data/                 # JSONs de exemplo/documentos
│   ├── regulamento.json               # sample original
│   ├── regulamento_completo_raw.json  # raw do usuário (9 capítulos)
│   └── regulamento_padrao.json        # transformado para seed
├── scripts/
│   ├── extract_pdf.py     # PDF → texto → IA → JSON
│   └── transform_json.py  # converte raw → formato do backend
├── docker-compose.yml
├── .env                   # SECRET_KEY, GEMINI_API_KEY, DEBUG
└── AGENTS.md
```

## Comandos

### Docker (principal)

```bash
# Subir tudo (build + start)
docker compose up -d --build

# Ver logs
docker compose logs -f

# Parar
docker compose down

# Executar comando no backend
docker compose exec backend python manage.py shell
docker compose exec backend python manage.py seed_default
docker compose exec backend python manage.py import_json /data/regulamento.json
```

### Local (sem Docker)

```bash
source .venv/bin/activate
cd backend && python manage.py runserver

# Extrair PDF (requer GEMINI_API_KEY no .env)
python ../scripts/extract_pdf.py ../data/meu_regulamento.pdf

# Transformar JSON raw → formato do backend
python ../scripts/transform_json.py
```

### Frontend

```bash
cd frontend
npm install          # instalar dependências (dagre incluso)
npm run dev          # dev server local
npm run build        # gera dist/ para produção via Django
```

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/documentos/` | Lista documentos |
| GET | `/api/v1/documentos/<slug>/` | Detalhe com capítulos e artigos |
| POST | `/api/v1/documentos/upload-json/` | Importa JSON |
| GET | `/api/v1/artigos/<id>/` | Detalhe do artigo |
| GET | `/api/v1/buscar/?q=...` | Busca textual |

## Layout da Interface

```
┌──────────────────────────────────────────────────────┐
│ Header (logo + busca + botão Importar)               │
├────────────┬─────────────────────────────────────────┤
│ Sidebar    │  Mapa Mental (React Flow)               │
│ (árvore    │  - Raiz (documento) no centro           │
│  de        │  - Capítulos irradiando em círculo      │
│  capítulos)│  - Artigos nas pontas                   │
│            │  - Nós em elipse (pill shape)            │
│            │  - Arestas bezier com 4 handles (T,R,B,L)│
│            │  - Arrastável com persistência de posição│
│            │  - Clique em artigo → modal             │
│            │  - Clique em capítulo → expand/colapsa  │
└────────────┴─────────────────────────────────────────┘
```

## Funcionalidades Implementadas

- **Mapa mental radial**: layout customizado (sem dagre), raiz central, nós equidistantes
- **Nós em elipse**: `rounded-full` com padding, gradientes e sombras
- **Handles nos 4 lados**: Top, Right, Bottom, Left — aresta escolhe o lado mais próximo
- **Arestas dinâmicas**: recalcula handles ao arrastar nó (onNodeDragStop)
- **Drag com persistência**: posição salva em ref, mantida ao expandir/colapsar
- **Collapse/expand**: clique no capítulo alterna visibilidade dos artigos
- **Modal de artigo**: popup centralizado com ESC para fechar
- **Seed automático**: `seed_default` importa `regulamento_padrao.json` se DB vazio
- **Upload JSON**: drag-and-drop na interface
- **Busca textual**: full-text search nos artigos
- **JSON transform**: `scripts/transform_json.py` converte raw → formato do backend

## Formato JSON esperado (upload / import_json)

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

## Fluxo de trabalho

1. Adicionar PDF em `data/`
2. (opcional) Extrair com IA: `python scripts/extract_pdf.py data/doc.pdf`
3. Transformar se necessário: `python scripts/transform_json.py`
4. Subir com Docker: `docker compose up -d --build`
5. Acessar `http://localhost:5173/` (dev) ou `http://localhost:8000/` (prod)
6. Upload manual: botão "+ Importar" na interface

## Próximos passos sugeridos

- [x] Persistir posições dos nós no localStorage (fase 1)
- [x] Suporte a múltiplos documentos simultâneos (fase 3)
- [ ] Persistir posições dos nós no backend
- [ ] Suporte a múltiplos documentos simultâneos
- [ ] Temas dark/light
- [ ] Exportar mapa como imagem
- [ ] Modo foco (selecionar capítulo e centralizar)
