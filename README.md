# 📜 Portal de Regulamentos — Mental Maps

> Portal inteligente de navegação em documentos normativos institucionais com mapa mental interativo e estruturação automática via IA.

## ✨ Funcionalidades

- **Upload de texto bruto** → estruturado automaticamente pela Gemini 2.5 Flash em hierarquia completa (LC 95/98)
- **Upload de JSON** para importação direta de documentos estruturados
- **Mapa mental interativo** com 5 layouts alternáveis (Radial, Árvore Vertical, Árvore Horizontal, Convexo, Força)
- **Hierarquia completa**: Parte → Livro → Título → Capítulo → Seção → Subseção → Artigo
- **Microestrutura normativa**: Artigos com caput, Parágrafos, Incisos, Alíneas e Itens
- **Busca textual com autocomplete** (3+ caracteres), escopada ao documento ativo
- **Highlight dos termos** no modal de artigo + blur progressivo no grafo (intensidade por nível hierárquico)
- **Breadcrumb navegável**: clique no título/capítulo/seção e navegue pelo documento
- **Artigos relacionados**: badges no rodapé + links inline no texto (ex: "Art. 5º" vira link)
- **Expansão de incisos** no MindMap com clique direito
- **Modo foco**: duplo clique no capítulo centraliza e destaca
- **Expandir/Recolher todos** sincronizado entre sidebar e MindMap
- **Nós arrastáveis** com persistência de posição (localStorage + backend)
- **Exportar**: mapa como PNG ou documento como JSON
- **Healthcheck** no Docker Compose para startup sem erros

## 🧱 Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | Django 6 + Django REST Framework + SQLite |
| Frontend | Vite + React 19 + Tailwind CSS 4 + React Flow 12 + dagre |
| IA | Google Gemini API (modelo `gemini-2.5-flash`) |
| Infra | Docker Compose |

## 🏗️ Estrutura do Projeto

```
mental-maps/
├── backend/                    # Django API
│   ├── config/                 # settings, urls
│   ├── regulations/            # models, views, serializers
│   │   └── management/commands/
│   │       ├── import_json.py
│   │       └── seed_default.py
│   └── requirements.txt
├── frontend/                   # Vite + React
│   └── src/
│       ├── components/
│       │   ├── Header.jsx          # Barra superior
│       │   ├── Sidebar.jsx         # Árvore de blocos
│       │   ├── MindMap.jsx         # Mapa mental com 5 layouts
│       │   ├── ArticleModal.jsx    # Modal de artigo
│       │   ├── TextUploadModal.jsx # Upload de texto com IA
│       │   └── UploadModal.jsx     # Upload de JSON
│       ├── api/client.js
│       └── App.jsx
├── data/                       # JSONs de exemplo
│   ├── regulamento_padrao.json
│   └── documento_completo.json
├── scripts/                    # Utilitários
│   ├── extract_pdf.py          # PDF → IA → JSON
│   └── transform_json.py
├── docker-compose.yml
├── .env
└── AGENTS.md
```

## 🚀 Como usar (Docker)

```bash
# Subir tudo (build + start)
docker compose up -d --build

# Acessar
#   Frontend (dev): http://localhost:5173/
#   Backend (API):  http://localhost:8039/

# Ver logs
docker compose logs -f

# Parar
docker compose down

# Executar comandos no backend
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
npm install
npm run dev       # Dev server
npm run build     # Produção
```

## 📖 API REST

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/v1/documentos/` | Lista todos os documentos |
| GET | `/api/v1/documentos/<slug>/` | Detalhe do documento com hierarquia completa |
| POST | `/api/v1/documentos/upload-json/` | Importa documento em JSON |
| POST | `/api/v1/documentos/upload-texto/` | Envia texto bruto para estruturar com IA |
| GET | `/api/v1/documentos/<slug>/posicoes/` | Atualiza posições dos nós |
| GET | `/api/v1/artigos/<id>/` | Detalhe do artigo com microestrutura |
| GET | `/api/v1/buscar/?q=...&slug=...` | Busca textual nos artigos |

## 🧠 Estrutura Hierárquica (LC 95/98)

O sistema modela documentos normativos conforme a Lei Complementar nº 95/1998:

### Macroestrutura (agrupamento temático)

```
Parte → Livro → Título → Capítulo → Seção → Subseção
```

### Microestrutura (desdobramento normativo)

```
Artigo (caput) → Parágrafo → Inciso → Alínea → Item
```

### Componentes de transição

- **Ementa**: resumo do objeto da lei
- **Preâmbulo**: declaração de autoridade
- **Disposições Gerais / Transitórias / Finais**

Apenas os níveis existentes no documento são criados — não há obrigatoriedade de todos estarem presentes.

## 🎨 Layout da Interface

```
┌──────────────────────────────────────────────────────────────┐
│ 📜 Portal  [Doc ▼]  [Layout: Radial ▼]  🔍 Buscar...  [+] │
├────────────────┬─────────────────────────────────────────────┤
│ Sidebar        │  Mapa Mental (React Flow)                   │
│ ▾ CAPÍTULO I   │     🌐 [Documento]                          │
│   Art. 1º      │    ╱  ╲  ╱  ╲                              │
│   Art. 2º      │  [Cap 1] [Cap 2] [Cap 3]                    │
│ ▸ CAPÍTULO II  │   ╱  ╲     ╱  ╲                             │
│ ▸ CAPÍTULO III │ [Art] [Art] [Art]                           │
│                │  📍 Nós arrastáveis com persistência        │
└────────────────┴─────────────────────────────────────────────┘
```

## ⚙️ Variáveis de ambiente

Criar arquivo `.env` na raiz do projeto:

```env
SECRET_KEY=change-this-to-a-random-secret-key
DEBUG=True
GEMINI_API_KEY=sua-chave-aqui
```

## 🧪 Documento de demonstração

O sistema já vem com um documento completo importado automaticamente via seed (`data/regulamento_padrao.json`).

Para testar a hierarquia completa com todos os níveis (Parte → Subseção → Artigo → Parágrafo → Inciso → Alínea → Item), use o documento em `data/documento_completo.json`:

```bash
curl -X POST http://localhost:8039/api/v1/documentos/upload-json/ \
  -H 'Content-Type: application/json' \
  -d @data/documento_completo.json
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feat/minha-feature`)
3. Commit suas mudanças (`git commit -m "feat: minha nova feature"`)
4. Push para a branch (`git push origin feat/minha-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT
