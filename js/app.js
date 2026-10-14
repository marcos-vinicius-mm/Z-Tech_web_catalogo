// Renderização das páginas Loja e Assistência.
(function () {
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, texto) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; };
  const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function textoPreco(p) {
    if (p.tipo === 'valor') return p.prefixo + moeda(p.valor);
    if (p.tipo === 'texto') return p.texto;
    return 'Consulte o valor';
  }
  const zap = (msg) => 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent(msg);

  // Se a foto não carregar (arquivo do Drive não compartilhado, link quebrado), mostra o aviso no lugar.
  function imagem(item) {
    if (!item.imagem) { const ph = el('div', 'sem-img marca-ph'); ph.setAttribute('aria-hidden', 'true'); return ph; }
    const i = el('img');
    i.alt = item.nome; i.loading = 'lazy'; i.referrerPolicy = 'no-referrer';
    i.addEventListener('error', () => {
      console.warn('[Z-Tech] Foto não carregou (confira o link e o compartilhamento):', item.id, item.imagem);
      i.replaceWith(el('div', 'sem-img', 'Foto indisponível'));
    }, { once: true });
    i.src = item.imagem;
    return i;
  }

  function card(item, aba, abrir) {
    const c = el('article', 'card');
    c.append(imagem(item));
    const corpo = el('div', 'card-corpo');
    const titulo = el('h3'); const b = el('button', 'link-titulo', item.nome); b.type = 'button'; b.addEventListener('click', () => abrir(item)); titulo.append(b);
    corpo.append(el('p', 'cat', item.categoria), titulo);
    if (aba === 'assistencia') {
      const meta = [item.prazo && 'Prazo: ' + item.prazo, item.garantia && 'Garantia: ' + item.garantia].filter(Boolean).join(' | ');
      if (meta) corpo.append(el('p', 'meta', meta));
    }
    corpo.append(el('p', 'preco', textoPreco(item.preco))); // por último: o CSS fixa o preço no pé do card, à esquerda
    c.append(corpo);
    return c;
  }

  function detalhe(item, aba) {
    const d = $('#detalhe'); const box = $('#detalhe-conteudo'); box.replaceChildren();
    box.append(imagem(item), el('h2', null, item.nome), el('p', 'preco', textoPreco(item.preco)));
    if (item.descricao) box.append(el('p', null, item.descricao));
    const campos = aba === 'loja'
      ? [['Marca', item.marca], ['Condição', item.condicao], ['Estoque', item.estoque], ['Compatibilidade', item.compatibilidade]]
      : [['Prazo', item.prazo], ['Garantia', item.garantia], ['Equipamentos', item.equipamentos]];
    const dl = el('dl');
    campos.filter((x) => x[1]).forEach(([k, v]) => dl.append(el('dt', null, k), el('dd', null, v)));
    box.append(dl);
    const z = $('#detalhe-zap');
    z.href = zap(aba === 'loja' ? 'Olá! Tenho interesse neste item: ' + item.nome : 'Olá! Gostaria de um orçamento para: ' + item.nome);
    z.querySelector('.txt').textContent = aba === 'loja' ? 'Chamar no WhatsApp' : 'Pedir orçamento';
    d.showModal();
  }

  function estado(msg, erro) { const s = $('#estado'); s.textContent = msg; s.hidden = !msg; s.className = 'estado' + (erro ? ' erro' : ''); }

  // Falha de leitura: mostra o motivo e um botão para tentar de novo.
  function falha(e) {
    const s = $('#estado'); s.hidden = false; s.className = 'estado erro'; s.replaceChildren();
    const b = el('button', 'btn', 'Tentar novamente'); b.type = 'button'; b.addEventListener('click', () => location.reload());
    s.append(el('strong', null, 'Não foi possível carregar a lista.'), el('p', 'motivo', 'Motivo: ' + (e && e.motivo ? e.motivo : 'erro desconhecido')), b);
  }

  // Rodapé comum às três páginas: endereço, horário e link "Como chegar" (Google Maps).
  function rodape() {
    const p = $('#endereco'); if (!p) return;
    const a = el('a', null, 'Como chegar');
    a.href = CONFIG.MAPS_URL || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.ENDERECO);
    a.target = '_blank'; a.rel = 'noopener';
    p.replaceChildren(CONFIG.ENDERECO + ' | ' + CONFIG.HORARIO + ' | ', a);
  }

  // Ícone opcional nos botões verdes (.btn-zap): se existir img/whatsapp.svg (ou img/whatsapp.png), ele aparece antes do texto.
  // Sem o arquivo, o botão fica só com o texto. Use um ícone branco, porque o botão é verde.
  function iconeDoBotao() {
    const botoes = document.querySelectorAll('.btn-zap'); if (!botoes.length) return;
    const tentar = (src, senao) => {
      const i = new Image();
      i.onload = () => botoes.forEach((b) => { const c = i.cloneNode(); c.className = 'ico-zap'; c.alt = ''; c.setAttribute('aria-hidden', 'true'); b.prepend(c); });
      i.onerror = senao; i.src = src;
    };
    tentar('img/whatsapp.svg', () => tentar('img/whatsapp.png', () => {}));
  }

  async function iniciar() {
    const aba = document.body.dataset.aba; // 'loja' | 'assistencia'
    estado('Carregando itens...');
    const espera = setTimeout(() => estado('Ainda carregando... a primeira leitura da planilha pode levar alguns segundos.'), 4000);
    let res;
    try { res = await Dados.carregar(aba); } catch (e) { clearTimeout(espera); falha(e); return; }
    clearTimeout(espera);
    let itens = res.itens;
    const aviso = { demo: 'Dados de demonstração: configure API_URL em js/config.js.', cache: 'Sem conexão com a planilha. Mostrando os últimos dados salvos.' }[res.origem];
    if (aviso) $('#aviso').textContent = aviso;

    const filtros = { q: $('#busca'), cat: $('#categoria'), tipo: $('#tipo'), ord: $('#ordem') };
    [...new Set(itens.map((i) => i.categoria))].sort().forEach((c) => filtros.cat.append(new Option(c, c)));

    // Barra de resultado: quantidade de itens e atalho para limpar os filtros.
    const cont = el('span'); cont.setAttribute('aria-live', 'polite');
    const limpar = el('button', 'limpar', 'Limpar filtros'); limpar.type = 'button';
    const barra = el('div', 'resultado'); barra.append(cont, limpar); $('.filtros').after(barra);
    limpar.addEventListener('click', () => { filtros.q.value = ''; filtros.cat.value = ''; if (filtros.tipo) filtros.tipo.value = ''; desenhar(); filtros.q.focus(); });

    function desenhar() {
      const q = filtros.q.value.trim().toLowerCase();
      let lista = itens.filter((i) =>
        (!q || [i.nome, i.marca, i.descricao, i.categoria].join(' ').toLowerCase().includes(q)) &&
        (!filtros.cat.value || i.categoria === filtros.cat.value) &&
        (!filtros.tipo || !filtros.tipo.value || i.tipo === filtros.tipo.value));
      const valor = (i) => (i.preco.tipo === 'valor' ? i.preco.valor : Infinity);
      const o = filtros.ord.value;
      lista.sort(o === 'menor' ? (a, b) => valor(a) - valor(b) : o === 'maior' ? (a, b) => (valor(b) === Infinity ? -1 : valor(b)) - (valor(a) === Infinity ? -1 : valor(a)) : (a, b) => (b.destaque - a.destaque) || a.nome.localeCompare(b.nome, 'pt-BR'));
      const grade = $('#grade'); grade.replaceChildren(...lista.map((i) => card(i, aba, (x) => detalhe(x, aba))));
      cont.textContent = lista.length + (lista.length === 1 ? ' item' : ' itens');
      limpar.hidden = !(q || filtros.cat.value || (filtros.tipo && filtros.tipo.value));
      estado(lista.length ? '' : 'Nenhum item encontrado. Limpe a busca ou troque os filtros.');
    }
    Object.values(filtros).forEach((f) => f && f.addEventListener('input', desenhar));
    desenhar();
  }

  // Carrossel de comentários de clientes (página inicial). Se não houver comentários, a seção continua oculta.
  const SVGNS = 'http://www.w3.org/2000/svg';
  function icone(caminho, cls) {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 20 20'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    if (cls) s.setAttribute('class', cls);
    const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', caminho); s.append(p);
    return s;
  }
  const ESTRELA = 'M10 1.6l2.6 5.5 6 .8-4.4 4.2 1.1 6L10 15.2 4.7 18l1.1-6L1.4 7.9l6-.8z';
  function estrelas(nota) {
    const w = el('span', 'estrelas'); w.setAttribute('role', 'img'); w.setAttribute('aria-label', 'Nota ' + nota + ' de 5');
    for (let i = 1; i <= 5; i++) w.append(icone(ESTRELA, i <= nota ? 'cheia' : 'vazia'));
    return w;
  }
  function botao(cls, rotulo) { const b = el('button', cls); b.type = 'button'; if (rotulo) b.setAttribute('aria-label', rotulo); return b; }

  async function depoimentos() {
    const secao = $('#depoimentos'); if (!secao) return;
    let lista;
    try { lista = await Dados.carregarComentarios(); } catch (e) { return; } // na página inicial uma falha não vira mensagem de erro
    if (!lista.length) return;

    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const regiao = el('div', 'carrossel'); regiao.setAttribute('role', 'region'); regiao.setAttribute('aria-roledescription', 'carrossel'); regiao.setAttribute('aria-label', 'Comentários de clientes');
    const faixa = el('div', 'faixa'); faixa.tabIndex = 0; faixa.setAttribute('aria-label', 'Comentários, use as setas do teclado para navegar');
    lista.forEach((c, i) => {
      const f = el('figure', 'depoimento'); f.setAttribute('role', 'group'); f.setAttribute('aria-roledescription', 'slide'); f.setAttribute('aria-label', (i + 1) + ' de ' + lista.length);
      if (c.nota) f.append(estrelas(c.nota));
      f.append(el('blockquote', null, c.texto));
      const cap = el('figcaption'); cap.append(el('strong', null, c.nome)); if (c.servico) cap.append(' | ' + c.servico);
      f.append(cap); faixa.append(f);
    });
    const ant = botao('seta', 'Comentário anterior'); ant.append(icone('M12.5 4l-6 6 6 6'));
    const prox = botao('seta', 'Próximo comentário'); prox.append(icone('M7.5 4l6 6-6 6'));
    const pontos = el('div', 'pontos');
    const ctl = el('div', 'carrossel-ctl'); ctl.append(ant, pontos, prox);
    regiao.append(faixa, ctl); $('#carrossel').replaceChildren(regiao);
    secao.hidden = false;

    const itens = [...faixa.children];
    // Rotação automática a cada 6 s (desligada se o aparelho pede movimento reduzido). Não há botão de pausa:
    // ela espera sozinha enquanto o mouse, o dedo ou o foco do teclado estão sobre o carrossel, e depois volta.
    const automatico = !reduzido;
    let sobre = false, foco = false, timer = null, raf = 0;
    const padE = () => parseFloat(getComputedStyle(faixa).paddingLeft) || 0;
    const porTela = () => Math.max(1, Math.round(faixa.clientWidth / itens[0].offsetWidth));
    const maxIdx = () => Math.max(0, itens.length - porTela());
    function atual() {
      let melhor = 0, d = Infinity;
      itens.forEach((it, i) => { const x = Math.abs(it.offsetLeft - padE() - faixa.scrollLeft); if (x < d) { d = x; melhor = i; } });
      return Math.min(melhor, maxIdx());
    }
    function ir(i) { faixa.scrollTo({ left: itens[Math.max(0, Math.min(i, maxIdx()))].offsetLeft - padE(), behavior: reduzido ? 'auto' : 'smooth' }); }
    const avancar = () => { const i = atual(); ir(i >= maxIdx() ? 0 : i + 1); };
    const voltar = () => { const i = atual(); ir(i <= 0 ? maxIdx() : i - 1); };

    function montarPontos() {
      pontos.replaceChildren();
      for (let i = 0; i <= maxIdx(); i++) { const p = botao('ponto', 'Ir para o comentário ' + (i + 1)); p.addEventListener('click', () => { ir(i); agendar(); }); pontos.append(p); }
      ctl.hidden = maxIdx() === 0; marcar();
    }
    function marcar() { const a = atual(); [...pontos.children].forEach((p, i) => p.setAttribute('aria-current', i === a ? 'true' : 'false')); }
    function agendar() { // (re)inicia a contagem; toda navegação manual também chama isto, então a próxima troca espera 6 s inteiros
      clearInterval(timer); timer = null;
      const parado = sobre || foco;
      faixa.setAttribute('aria-live', automatico && !parado ? 'off' : 'polite');
      if (automatico && !parado && !document.hidden && maxIdx() > 0) timer = setInterval(avancar, 6000);
    }

    ant.addEventListener('click', () => { voltar(); agendar(); });
    prox.addEventListener('click', () => { avancar(); agendar(); });
    faixa.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(marcar); }, { passive: true });
    faixa.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); avancar(); agendar(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); voltar(); agendar(); }
    });
    // pointerenter/leave valem para mouse e para toque (no toque o "leave" vem quando o dedo sai), sem travar o carrossel depois de um toque.
    regiao.addEventListener('pointerenter', () => { sobre = true; agendar(); });
    regiao.addEventListener('pointerleave', () => { sobre = false; agendar(); });
    regiao.addEventListener('focusin', (e) => { foco = e.target.matches(':focus-visible'); agendar(); }); // só o foco por teclado pausa
    regiao.addEventListener('focusout', () => { foco = false; agendar(); });
    document.addEventListener('visibilitychange', agendar);
    let largura = faixa.clientWidth;
    window.addEventListener('resize', () => { if (faixa.clientWidth !== largura) { largura = faixa.clientWidth; montarPontos(); agendar(); } });
    montarPontos(); agendar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    rodape();
    iconeDoBotao();
    const fechar = $('#fechar'); if (fechar) fechar.addEventListener('click', () => $('#detalhe').close());
    if (document.body.dataset.aba) iniciar();
    depoimentos();
  });
})();
