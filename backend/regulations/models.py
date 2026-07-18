from django.db import models


class Documento(models.Model):
    titulo = models.CharField(max_length=500)
    slug = models.SlugField(unique=True, max_length=200)
    criado_em = models.DateTimeField(auto_now_add=True)
    posicoes = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['criado_em']

    def __str__(self):
        return self.titulo


class Capitulo(models.Model):
    documento = models.ForeignKey(Documento, on_delete=models.CASCADE, related_name='capitulos')
    id_code = models.CharField(max_length=30)
    titulo = models.CharField(max_length=500)
    ordem = models.IntegerField()

    class Meta:
        ordering = ['ordem']
        unique_together = ['documento', 'id_code']

    def __str__(self):
        return f'{self.id_code} - {self.titulo}'


class Artigo(models.Model):
    capitulo = models.ForeignKey(Capitulo, on_delete=models.CASCADE, related_name='artigos')
    id_code = models.CharField(max_length=30)
    titulo = models.CharField(max_length=500, blank=True, default='')
    texto = models.TextField()
    ordem = models.IntegerField()
    relacionados = models.ManyToManyField('self', blank=True, symmetrical=False)

    class Meta:
        ordering = ['ordem']
        unique_together = ['capitulo', 'id_code']

    def __str__(self):
        return self.id_code
