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
- Hospedagem estática (sugestão: GitHub Pages). **Local ainda não definido.**
- Google Sheets como banco de dados e painel administrativo.
- Leitura dos dados por **Apps Script publicado como Web App**, que devolve JSON consumido via `fetch`.
- Alternativa para prototipagem: planilha publicada como CSV. Os relatos de CORS nessa rota são inconsistentes e não foram testados, então não deve ser a solução definitiva.
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

### Regras de dados

- Preços seguem o formato brasileiro (vírgula decimal, ponto de milhar). Valores que não puderem ser interpretados são **rejeitados e registrados no console**, nunca "adivinhados" (evita o bug de preços dez vezes maiores visto em projeto real).
- Linhas sem `id` ou sem `nome` são ignoradas.
- Links normais do Google Drive não funcionam em `<img>`: usar URL pública ou converter o link do Drive pelo código do arquivo.

## 5. Páginas e contato

- **Início:** apresentação, dois atalhos principais (Loja e Assistência Técnica), contato, endereço e horário.
- **Loja:** grade de cards, busca, filtro por tipo e categoria, ordenação, detalhe do item em modal.
- **Assistência Técnica:** serviços e consertos por categoria, com prazo e garantia.
- **Produto:** botão "Chamar no WhatsApp" com o nome do item na mensagem.
- **Serviço:** botão "Pedir orçamento" com o nome do serviço na mensagem.
- O número do WhatsApp vem de **uma única constante de configuração**.

## 6. Identidade visual

- Marca: **Z-Tech Informática**. Logo em `site/img/logo.jpg` (completa) e `site/img/marca.png` (círculo, usado como favicon e no cabeçalho).
- Paleta tirada da logo: preto `#000000`, branco `#FFFFFF` e vermelho `#C22127`. Vermelho escuro `#9A1A1F` para hover e texto sobre fundo claro (contraste).
- Tipografia: títulos em serifa itálica em negrito, que lembra o logotipo; texto corrido em fonte do sistema (sem fontes externas).
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

- Número de WhatsApp da loja.
- Endereço, horário e redes sociais.
- Definição final do método de leitura (Apps Script ou CSV).
- Local de hospedagem.

## 10. Plano de entrega

1. Branch `docs/especificacao` com este documento.
2. Estrutura base do site e layout das páginas, em outra branch.
3. Integração com a planilha e renderização dos itens.
4. Ajustes de design, acessibilidade e publicação.
