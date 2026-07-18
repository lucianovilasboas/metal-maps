from django.urls import path
from . import views

urlpatterns = [
    path('documentos/', views.listar_documentos, name='listar-documentos'),
    path('documentos/upload-json/', views.upload_json, name='upload-json'),
    path('documentos/<slug:slug>/', views.detalhe_documento, name='detalhe-documento'),
    path('documentos/<slug:slug>/posicoes/', views.atualizar_posicoes, name='atualizar-posicoes'),
    path('artigos/<int:pk>/', views.detalhe_artigo, name='detalhe-artigo'),
    path('buscar/', views.buscar, name='buscar'),
]
