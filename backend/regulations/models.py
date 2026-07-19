from django.db import models


class Documento(models.Model):
    titulo = models.CharField(max_length=500)
    slug = models.SlugField(unique=True, max_length=200)
    criado_em = models.DateTimeField(auto_now_add=True)
    posicoes = models.JSONField(default=dict, blank=True)
    ementa = models.TextField(blank=True, default='')
    preambulo = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['criado_em']

    def __str__(self):
        return self.titulo


class EstruturaBloco(models.Model):
    TIPOS = [
        ('parte', 'Parte'),
        ('livro', 'Livro'),
        ('titulo', 'Título'),
        ('capitulo', 'Capítulo'),
        ('secao', 'Seção'),
        ('subsecao', 'Subseção'),
    ]

    documento = models.ForeignKey(Documento, on_delete=models.CASCADE, related_name='blocos')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='filhos')
    tipo = models.CharField(max_length=10, choices=TIPOS)
    rotulo = models.CharField(max_length=50, blank=True, default='')
    titulo = models.CharField(max_length=500, blank=True, default='')
    ordem = models.IntegerField()

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return f'{self.rotulo} - {self.titulo}'


class Artigo(models.Model):
    bloco = models.ForeignKey(EstruturaBloco, on_delete=models.CASCADE, related_name='artigos')
    id_code = models.CharField(max_length=30)
    titulo = models.CharField(max_length=500, blank=True, default='')
    texto = models.TextField(blank=True, default='')
    caput = models.TextField(blank=True, default='')
    ordem = models.IntegerField()
    relacionados = models.ManyToManyField('self', blank=True, symmetrical=False)

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return self.id_code


class Paragrafo(models.Model):
    artigo = models.ForeignKey(Artigo, on_delete=models.CASCADE, related_name='paragrafos')
    rotulo = models.CharField(max_length=50, blank=True, default='')
    texto = models.TextField(blank=True, default='')
    ordem = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return f'{self.rotulo} - {self.artigo.id_code}'


class Inciso(models.Model):
    artigo = models.ForeignKey(Artigo, on_delete=models.CASCADE, null=True, blank=True, related_name='incisos')
    paragrafo = models.ForeignKey(Paragrafo, on_delete=models.CASCADE, null=True, blank=True, related_name='incisos')
    rotulo = models.CharField(max_length=20)
    texto = models.TextField(blank=True, default='')
    ordem = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return self.rotulo


class Alinea(models.Model):
    inciso = models.ForeignKey(Inciso, on_delete=models.CASCADE, related_name='alineas')
    rotulo = models.CharField(max_length=10)
    texto = models.TextField(blank=True, default='')
    ordem = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return self.rotulo


class Item(models.Model):
    alinea = models.ForeignKey(Alinea, on_delete=models.CASCADE, related_name='itens')
    rotulo = models.CharField(max_length=10)
    texto = models.TextField(blank=True, default='')
    ordem = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return self.rotulo


class Disposicao(models.Model):
    TIPOS = [
        ('gerais', 'Disposições Gerais'),
        ('transitorias', 'Disposições Transitórias'),
        ('finais', 'Disposições Finais'),
    ]

    documento = models.ForeignKey(Documento, on_delete=models.CASCADE, related_name='disposicoes')
    tipo = models.CharField(max_length=20, choices=TIPOS)
    texto = models.TextField()
    ordem = models.IntegerField(default=0)

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return f'{self.get_tipo_display()} - {self.documento.titulo}'
