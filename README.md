# Convite interativo estilo Milena & Bento

Este projeto recria a experiência do modelo de referência com:

- capa vertical estilo mobile;
- foto de fundo substituível;
- envelope branco no topo;
- selo dourado central;
- texto curvado "CLIQUE AQUI";
- nomes grandes na parte inferior;
- animação de abertura;
- convite interno com páginas;
- RSVP local para teste;
- botões de mapa, lista de presentes, Pix, música e compartilhar.

## Como testar localmente

1. Extraia o ZIP.
2. Abra o arquivo `index.html` no navegador.
3. Clique no selo ou em qualquer lugar da capa.

## Como trocar a foto de fundo

Substitua o arquivo:

```txt
assets/foto-casal-exemplo.jpg
```

por sua própria foto, mantendo o mesmo nome.

Recomendação de foto:
- vertical;
- proporção 9:16;
- resolução sugerida: 1080x1920 ou maior;
- casal posicionado do meio para baixo, para não brigar com o envelope.

## Como trocar nomes e iniciais

No arquivo `index.html`, procure por:

```html
<span>MB</span>
<h1>Milena <span>e</span> Bento</h1>
```

Troque pelas iniciais e nomes desejados.

## Como trocar as cores

No arquivo `style.css`, edite:

```css
--seal-gold
--seal-dark
--seal-light
--accent
--accent-dark
```

## Como ativar música

1. Crie ou coloque o arquivo:

```txt
assets/musica.mp3
```

2. No `index.html`, descomente a linha:

```html
<source src="assets/musica.mp3" type="audio/mpeg" />
```

## RSVP

O formulário salva os dados no `localStorage` do navegador apenas para teste.

Para produção, conecte com:
- Google Sheets;
- Firebase;
- Supabase;
- backend próprio;
- formulário externo como Tally, Typeform ou Google Forms.
