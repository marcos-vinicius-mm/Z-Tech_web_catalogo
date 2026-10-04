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

  function imagem(item) {
    if (!item.imagem) return el('div', 'sem-img', 'Sem foto');
    const i = el('img'); i.src = item.imagem; i.alt = item.nome; i.loading = 'lazy'; return i;
  }

  function card(item, aba, abrir) {
    const c = el('article', 'card');
    c.append(imagem(item));
    const corpo = el('div', 'card-corpo');
    const titulo = el('h3'); const b = el('button', 'link-titulo', item.nome); b.type = 'button'; b.addEventListener('click', () => abrir(item)); titulo.append(b);
    corpo.append(el('p', 'cat', item.categoria), titulo, el('p', 'preco', textoPreco(item.preco)));
    if (aba === 'assistencia') corpo.append(el('p', 'meta', [item.prazo && 'Prazo: ' + item.prazo, item.garantia && 'Garantia: ' + item.garantia].filter(Boolean).join(' | ')));
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
    const a = el('a', 'btn', aba === 'loja' ? 'Chamar no WhatsApp' : 'Pedir orçamento');
    a.href = zap(aba === 'loja' ? 'Olá! Tenho interesse neste item: ' + item.nome : 'Olá! Gostaria de um orçamento para: ' + item.nome);
    a.target = '_blank'; a.rel = 'noopener';
    box.append(a);
    d.showModal();
  }

  function estado(msg, erro) { const s = $('#estado'); s.textContent = msg; s.hidden = !msg; s.className = 'estado' + (erro ? ' erro' : ''); }

  async function iniciar() {
    const aba = document.body.dataset.aba; // 'loja' | 'assistencia'
    estado('Carregando...');
    let res;
    try { res = await Dados.carregar(aba); } catch (e) { estado('Não foi possível carregar a lista. Verifique a conexão e recarregue a página.', true); return; }
    let itens = res.itens;
    const aviso = { demo: 'Dados de demonstração: configure API_URL em js/config.js.', cache: 'Sem conexão com a planilha. Mostrando os últimos dados salvos.' }[res.origem];
    if (aviso) $('#aviso').textContent = aviso;

    const filtros = { q: $('#busca'), cat: $('#categoria'), tipo: $('#tipo'), ord: $('#ordem') };
    [...new Set(itens.map((i) => i.categoria))].sort().forEach((c) => filtros.cat.append(new Option(c, c)));

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
      estado(lista.length ? '' : 'Nenhum item encontrado. Limpe a busca ou troque os filtros.');
    }
    Object.values(filtros).forEach((f) => f && f.addEventListener('input', desenhar));
    desenhar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const fechar = $('#fechar'); if (fechar) fechar.addEventListener('click', () => $('#detalhe').close());
    if (document.body.dataset.aba) iniciar();
  });
})();
