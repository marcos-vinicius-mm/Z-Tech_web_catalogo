# Z-Tech Informática – Web Catálogo: Especificação

## 1. Resumo

- **Negócio:** Z-Tech Informática, loja de informática e assistência técnica.
- **Objetivo:** vitrine online com duas áreas separadas: **Loja** (produtos e peças) e **Assistência Técnica** (serviços e consertos).
- **Conteúdo:** alimentado por uma planilha do Google Sheets. Cada linha nova gera um novo item na página, sem mexer no código.

## 2. Decisões

- Nunca haverá pagamento no site: sem carrinho, sem checkout, sem login.
- O contato é feito por **WhatsApp**, com mensagem pré-preenchida contendo o item escolhido.
- Todo trabalho é feito em branch separada, nunca direto na `main`.
- Primeiro as especificações; depois a integração com o Google Sheets.
- Exibição separada entre Loja e Assistência Técnica.

## 3. Arquitetura

- Site estático em HTML, CSS e JavaScript puro, sem frameworks e sem dependências externas de runtime.
- Hospedagem estática no **GitHub Pages**.
- Google Sheets como banco de dados e painel administrativo.
- Leitura dos dados por **Apps Script publicado como Web App**, que devolve JSON consumido via `fetch`.
- Método de leitura definido: **Apps Script** (a alternativa de planilha publicada como CSV foi descartada por relatos inconsistentes de CORS).
- Descartado: sincronizar a planilha com o repositório por GitHub Action (só atualiza a cada sincronização).
- Cache local (`localStorage`) com os últimos dados válidos, usado se a planilha falhar ou demorar.

## 4. Planilha

A primeira linha de cada aba é o cabeçalho.

### Aba `Loja`

| Coluna | Descrição |
|---|---|
| id | Identificador único |
| nome | Nome exibido |
| tipo | `produto` ou `peca` |
| categoria | Ex.: Notebooks, Memórias, Periféricos |
| marca | Marca do item |
| descricao | Texto curto |
| preco | Valor em formato brasileiro (`1.299,90`) |
| estoque | Quantidade ou disponibilidade |
| condicao | `novo` ou `usado` |
| compatibilidade | Opcional, útil para peças |
| imagem | URL pública da imagem |
| destaque | `SIM` para aparecer em destaque |
| ativo | `SIM` exibe; vazio ou `NAO` oculta |

### Aba `Assistencia`

| Coluna | Descrição |
|---|---|
| id | Identificador único |
| nome | Nome do serviço |
| categoria | Ex.: Formatação, Troca de tela, Limpeza |
| descricao | Texto curto |
| preco | Valor, "a partir de" ou "sob orçamento" |
| prazo | Prazo estimado |
| garantia | Garantia oferecida |
| equipamentos | Equipamentos atendidos |
| imagem | URL pública da imagem ou ícone |
| ativo | `SIM` exibe; vazio ou `NAO` oculta |

### Aba `Comentarios`

Alimenta o carrossel de comentários de clientes na página inicial.

| Coluna | Descrição |
|---|---|
| id | Gerado automaticamente (`C001`, `C002`...) |
| nome | Nome exibido (de preferência o primeiro nome e a inicial do sobrenome) |
| comentario | Texto do cliente (até cerca de 300 caracteres) |
| nota | Opcional: número de 1 a 5 (estrelas) |
| servico | Opcional: `Loja` ou `Assistência técnica` |
| data | Opcional: `dd/mm/aaaa`, usada para mostrar os mais recentes primeiro |
| ativo | `SIM` publica; vazio ou `NAO` oculta |

### Regras de dados

- Preços seguem o formato brasileiro (vírgula decimal, ponto de milhar). Valores que não puderem ser interpretados são **rejeitados e registrados no console**, nunca "adivinhados" (evita o bug de preços dez vezes maiores visto em projeto real).
- Linhas sem `id` ou sem `nome` são ignoradas.
- Imagens: o site aceita URL pública ou o link de compartilhamento do Google Drive, que é convertido pelo código do arquivo (o arquivo precisa estar com acesso "Qualquer pessoa com o link"). Link de pasta do Drive é ignorado.
- Comentários: só saem da planilha com `ativo` = `SIM` (o Apps Script filtra no servidor); sem `id`, `nome` ou `comentario`, a linha é ignorada; nota fora de 1 a 5 é descartada e registrada no console. Só publicar comentário com a autorização do cliente.

## 5. Páginas e contato

- **Início:** apresentação, dois atalhos principais (Loja e Assistência Técnica), carrossel de comentários de clientes, contato, endereço e horário.
- **Carrossel de comentários:** 1 comentário por tela no celular e 3 no desktop; setas, pontos, rolagem por toque e teclado; rotação automática a cada 6 s com botão Pausar (desligada com movimento reduzido e ao interagir); a seção fica oculta se não houver comentários ou se a leitura falhar.
- **Loja:** grade de cards, busca, filtro por tipo e categoria, ordenação, detalhe do item em modal.
- **Assistência Técnica:** serviços e consertos por categoria, com prazo e garantia.
- **Produto:** botão "Chamar no WhatsApp" com o nome do item na mensagem.
- **Serviço:** botão "Pedir orçamento" com o nome do serviço na mensagem.
- O número do WhatsApp vem de **uma única constante de configuração**.

## 6. Identidade visual

- Marca: **Z-Tech Informática**. Logo em `site/img/logo.jpg` (completa) e `site/img/marca.png` (círculo, usado como favicon e no cabeçalho).
- Paleta tirada da logo: preto `#000000`, branco `#FFFFFF` e vermelho `#C22127`. Vermelho escuro `#9A1A1F` para hover e texto sobre fundo claro (contraste).
- Tipografia: família única **Inter** (sem serifa, padrão em lojas e interfaces de tecnologia), variável e hospedada em `fonts/inter.woff2` (licença OFL). Pesos 400, 500, 600, 700 e 800 e escala de tamanhos definidas como variáveis no CSS (12, 13, 14, 16, 18, 20 e 24 px, mais um tamanho fluido para o título). Sem itálico e sem fontes externas.
- Cabeçalho preto com filete vermelho; página inicial abre com a logo sobre fundo preto.

## 7. Requisitos não funcionais

- Mobile-first e responsivo.
- Estados de carregamento, vazio e erro.
- Acessibilidade básica (contraste, foco, `alt` nas imagens, semântica HTML).
- SEO básico (título, descrição, Open Graph).
- Sem dependências externas de runtime.

## 8. Fora do escopo da v1

- Carrinho, pagamento e login.
- Painel administrativo próprio (a planilha cumpre esse papel).

## 9. Pendências

- Redes sociais da loja.
- Comentários reais de clientes (e autorização para publicá-los).

## 10. Plano de entrega

1. Branch `docs/especificacao` com este documento.
2. Estrutura base do site e layout das páginas, em outra branch.
3. Integração com a planilha e renderização dos itens.
4. Ajustes de design, acessibilidade e publicação.
