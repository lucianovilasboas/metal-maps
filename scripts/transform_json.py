import json
import sys
from pathlib import Path


def to_id_code(num):
    return f"art-{num}"


def extract_text(artigo):
    partes = []
    if "descricao" in artigo:
        partes.append(artigo["descricao"])
    if "itens" in artigo:
        partes.append("Itens:\n" + "\n".join(f"- {i}" for i in artigo["itens"]))
    if "folhas" in artigo:
        partes.append("\n".join(f"- {f}" for f in artigo["folhas"]))
    if "tipos" in artigo:
        partes.append("Tipos: " + ", ".join(artigo["tipos"]))
    if "lista" in artigo:
        partes.append("\n".join(f"- {l}" for l in artigo["lista"]))
    if "aplicacao" in artigo:
        partes.append(f"Aplicação: {artigo['aplicacao']}")
    if "regras" in artigo:
        partes.append("Regras:\n" + "\n".join(f"- {r}" for r in artigo["regras"]))
    if "causas" in artigo:
        partes.append("Causas:\n" + "\n".join(f"- {c}" for c in artigo["causas"]))
    return "\n\n".join(partes)


def transform(raw):
    titulo = raw.get("regulamento", "Documento")
    base = titulo.lower()
    for ch in "çãõéêíóúôâ":
        base = base.replace(ch, {"ç": "c", "ã": "a", "õ": "o", "é": "e", "ê": "e", "í": "i", "ó": "o", "ú": "u", "ô": "o", "â": "a"}[ch])
    for ch in "().,:;!?&":
        base = base.replace(ch, "")
    parts = [p for p in base.replace("-", " ").split() if p]
    slug = "-".join(parts)[:200]

    capitulos = []
    for i, cap in enumerate(raw.get("estrutura", [])):
        capitulo_id = f"cap-{i + 1}"
        capitulo_titulo = cap.get("capitulo", f"Capítulo {i + 1}")

        artigos = []
        for j, art in enumerate(cap.get("artigos", [])):
            art_id = art.get("id", j + 1)
            artigos.append({
                "id": to_id_code(art_id),
                "titulo": art.get("titulo", ""),
                "texto": extract_text(art),
                "relacionados": art.get("relacionados", []),
            })

        capitulos.append({
            "id": capitulo_id,
            "titulo": capitulo_titulo,
            "artigos": artigos,
        })

    result = {
        "slug": slug,
        "titulo": titulo,
        "capitulos": capitulos,
    }
    return result


def main():
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else \
        Path(__file__).parent.parent / "data" / "regulamento_completo_raw.json"
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else \
        Path(__file__).parent.parent / "data" / "regulamento_padrao.json"

    with open(input_path, "r", encoding="utf-8") as f:
        raw = json.load(f)

    adapted = transform(raw)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(adapted, f, indent=2, ensure_ascii=False)

    print(f"Transformado: {input_path} → {output_path}")
    print(f"Título: {adapted['titulo']}")
    print(f"Slug: {adapted['slug']}")
    print(f"Capítulos: {len(adapted['capitulos'])}")


if __name__ == "__main__":
    main()
