// Leitura, validação e cache dos dados da planilha.
(function () {
  const CHAVE = 'ztech:dados:v1';
  const t = (v) => (v == null ? '' : String(v).trim());

  const DEMO = {
    loja: [
      { id: 'L1', nome: 'Notebook 15" i5 8GB', tipo: 'produto', categoria: 'Notebooks', marca: 'Exemplo', descricao: 'Item de demonstração.', preco: '2.899,90', estoque: '2', condicao: 'novo', compatibilidade: '', imagem: '', destaque: 'SIM', ativo: 'SIM' },
      { id: 'L2', nome: 'Memória DDR4 8GB', tipo: 'peca', categoria: 'Memórias', marca: 'Exemplo', descricao: 'Item de demonstração.', preco: '189,00', estoque: '10', condicao: 'novo', compatibilidade: 'Notebooks e desktops DDR4', imagem: '', destaque: '', ativo: 'SIM' }
    ],
    assistencia: [
      { id: 'A1', nome: 'Formatação com backup', categoria: 'Formatação', descricao: 'Item de demonstração.', preco: 'a partir de 80,00', prazo: '1 dia', garantia: '30 dias', equipamentos: 'Notebook e desktop', imagem: '', ativo: 'SIM' },
      { id: 'A2', nome: 'Troca de tela', categoria: 'Troca de tela', descricao: 'Item de demonstração.', preco: 'sob orçamento', prazo: '3 a 5 dias', garantia: '90 dias', equipamentos: 'Notebook', imagem: '', ativo: 'SIM' }
    ]
  };

  // Preço no formato brasileiro. Nunca "adivinha": o que não for reconhecido é rejeitado.
  function lerPreco(bruto) {
    const s = t(bruto);
    if (!s) return { tipo: 'vazio' };
    if (/^sob or[cç]amento$/i.test(s)) return { tipo: 'texto', texto: 'Sob orçamento' };
    const m = s.match(/^(a partir de\s+)?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)$/i);
    if (!m) { console.warn('[Z Tech] Preço rejeitado (formato inválido):', s); return { tipo: 'invalido' }; }
    return { tipo: 'valor', valor: Number(m[2].replace(/\./g, '').replace(',', '.')), prefixo: m[1] ? 'A partir de ' : '' };
  }

  const urlImagem = (v) => (/^https?:\/\//i.test(t(v)) ? t(v) : '');

  function normalizar(linhas) {
    return (Array.isArray(linhas) ? linhas : [])
      .filter((l) => t(l.id) && t(l.nome) && t(l.ativo).toUpperCase() === 'SIM')
      .map((l) => ({
        id: t(l.id), nome: t(l.nome), tipo: t(l.tipo).toLowerCase(), categoria: t(l.categoria) || 'Outros',
        marca: t(l.marca), descricao: t(l.descricao), preco: lerPreco(l.preco), estoque: t(l.estoque),
        condicao: t(l.condicao).toLowerCase(), compatibilidade: t(l.compatibilidade), imagem: urlImagem(l.imagem),
        destaque: t(l.destaque).toUpperCase() === 'SIM', prazo: t(l.prazo), garantia: t(l.garantia), equipamentos: t(l.equipamentos)
      }));
  }

  async function buscar() {
    if (!CONFIG.API_URL) return { dados: DEMO, origem: 'demo' };
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), CONFIG.TIMEOUT_MS);
    try {
      const r = await fetch(CONFIG.API_URL, { signal: ctl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const dados = await r.json();
      try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* sem cache */ }
      return { dados, origem: 'rede' };
    } catch (erro) {
      console.warn('[Z Tech] Falha ao ler a planilha:', erro);
      try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE));
        if (salvo) return { dados: salvo, origem: 'cache' };
      } catch (e) { /* cache inválido */ }
      throw erro;
    } finally { clearTimeout(timer); }
  }

  window.Dados = {
    async carregar(aba) {
      const { dados, origem } = await buscar();
      return { itens: normalizar(dados[aba]), origem };
    }
  };
})();
