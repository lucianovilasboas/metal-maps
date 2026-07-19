import json
from pathlib import Path
from django.core.management.base import BaseCommand
from regulations.models import Documento, EstruturaBloco, Artigo


class Command(BaseCommand):
    help = "Seeds the database with default data if no documents exist"

    def add_arguments(self, parser):
        parser.add_argument("--path", type=str, default=None)

    def handle(self, *args, **options):
        if Documento.objects.exists():
            self.stdout.write("Documentos já existem. Pulando seed.")
            return

        path = options["path"]
        if not path:
            base = Path(__file__).resolve().parent.parent.parent.parent.parent
            path = str(base / "data" / "regulamento_padrao.json")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        docs = data.get("documentos", [data]) if isinstance(data, dict) else data

        for doc_data in docs:
            titulo = doc_data.get("titulo", "Documento")
            slug = doc_data.get("slug", titulo.lower().replace(" ", "-"))
            capitulos = doc_data.get("capitulos", [])

            doc, created = Documento.objects.get_or_create(
                slug=slug, defaults={"titulo": titulo, "preambulo": "", "ementa": ""}
            )
            if not created:
                doc.titulo = titulo
                doc.save()
                doc.blocos.all().delete()

            for i, cap_data in enumerate(capitulos):
                bloco = EstruturaBloco.objects.create(
                    documento=doc,
                    tipo="capitulo",
                    rotulo=cap_data.get("id", f"cap{i+1}"),
                    titulo=cap_data.get("titulo", ""),
                    ordem=i + 1,
                )
                for j, art_data in enumerate(cap_data.get("artigos", [])):
                    Artigo.objects.create(
                        bloco=bloco,
                        id_code=art_data.get("id", f"art{j+1}"),
                        titulo=art_data.get("titulo", ""),
                        texto=art_data.get("texto", ""),
                        ordem=j + 1,
                    )

            for i, cap_data in enumerate(capitulos):
                for j, art_data in enumerate(cap_data.get("artigos", [])):
                    id_code = art_data.get("id", f"art{j+1}")
                    rel_ids = art_data.get("relacionados", [])
                    if rel_ids:
                        try:
                            artigo = Artigo.objects.get(
                                bloco__documento=doc, id_code=id_code
                            )
                            for rid in rel_ids:
                                try:
                                    rel = Artigo.objects.get(
                                        bloco__documento=doc, id_code=rid
                                    )
                                    artigo.relacionados.add(rel)
                                except Artigo.DoesNotExist:
                                    pass
                        except Artigo.DoesNotExist:
                            pass

            self.stdout.write(
                self.style.SUCCESS(f"Seed: {doc.titulo} ({doc.slug})")
            )
