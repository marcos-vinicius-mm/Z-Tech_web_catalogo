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
    if (!m) { console.warn('[Z-Tech] Preço rejeitado (formato inválido):', s); return { tipo: 'invalido' }; }
    return { tipo: 'valor', valor: Number(m[2].replace(/\./g, '').replace(',', '.')), prefixo: m[1] ? 'A partir de ' : '' };
  }

  // Imagem: aceita URL pública (http vira https) ou link de compartilhamento do Google Drive.
  // Links do Drive não funcionam em <img>; aqui viram a URL de miniatura pelo código do arquivo.
  // O arquivo precisa estar compartilhado como "Qualquer pessoa com o link".
  function resolverImagem(bruto) {
    const s = t(bruto).replace(/\s+/g, '');
    if (!s) return '';
    if (/^https?:\/\/drive\.google\.com\//i.test(s)) {
      if (/\/folders\//i.test(s)) { console.warn('[Z-Tech] Imagem ignorada (link de pasta do Drive; use o link do arquivo):', s); return ''; }
      const m = s.match(/\/file\/d\/([\w-]{10,})/i) || s.match(/[?&]id=([\w-]{10,})/i);
      if (!m) { console.warn('[Z-Tech] Imagem ignorada (link do Drive sem código de arquivo):', s); return ''; }
      return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000';
    }
    if (/^https?:\/\//i.test(s)) return s.replace(/^http:\/\//i, 'https://');
    console.warn('[Z-Tech] Imagem ignorada (não é uma URL http/https):', s);
    return '';
  }

  function normalizar(linhas) {
    return (Array.isArray(linhas) ? linhas : [])
      .filter((l) => t(l.id) && t(l.nome) && t(l.ativo).toUpperCase() === 'SIM')
      .map((l) => ({
        id: t(l.id), nome: t(l.nome), tipo: t(l.tipo).toLowerCase(), categoria: t(l.categoria) || 'Outros',
        marca: t(l.marca), descricao: t(l.descricao), preco: lerPreco(l.preco), estoque: t(l.estoque),
        condicao: t(l.condicao).toLowerCase(), compatibilidade: t(l.compatibilidade), imagem: resolverImagem(l.imagem),
        destaque: t(l.destaque).toUpperCase() === 'SIM', prazo: t(l.prazo), garantia: t(l.garantia), equipamentos: t(l.equipamentos)
      }));
  }

  function erro(motivo, causa, definitivo) { const e = new Error(motivo); e.motivo = motivo; e.causa = causa; e.definitivo = !!definitivo; return e; }

  // Uma tentativa de leitura. O motivo da falha fica explícito para facilitar o diagnóstico em outros aparelhos.
  async function lerPlanilha() {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), CONFIG.TIMEOUT_MS);
    try {
      let r;
      try { r = await fetch(CONFIG.API_URL, { signal: ctl.signal }); }
      catch (e) { throw erro(e.name === 'AbortError' ? 'tempo esgotado: a planilha demorou demais para responder' : 'sem conexão ou acesso bloqueado pela rede', e); }
      if (!r.ok) throw erro('o Apps Script respondeu HTTP ' + r.status, null, r.status >= 400 && r.status < 500);
      const texto = await r.text();
      let dados;
      try { dados = JSON.parse(texto); }
      catch (e) { throw erro(/^\s*</.test(texto) ? 'o Apps Script devolveu uma página em vez de JSON: confira se a implantação está com acesso "Qualquer pessoa" e se a URL termina em /exec' : 'resposta inválida (não é JSON)', e, true); }
      if (!dados || (!Array.isArray(dados.loja) && !Array.isArray(dados.assistencia))) throw erro('o JSON não traz as abas "loja" e "assistencia"', null, true);
      return dados;
    } finally { clearTimeout(timer); }
  }

  async function buscar() {
    if (!CONFIG.API_URL) return { dados: DEMO, origem: 'demo' };
    let ultimo;
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        const dados = await lerPlanilha();
        try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch (e) { /* sem cache */ }
        return { dados, origem: 'rede' };
      } catch (e) {
        ultimo = e;
        console.warn('[Z-Tech] Falha ao ler a planilha (tentativa ' + tentativa + '):', e.motivo || e, e.causa || '');
        if (e.definitivo) break; // erro de configuração: repetir não adianta
      }
    }
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE));
      if (salvo) return { dados: salvo, origem: 'cache' };
    } catch (e) { /* cache inválido */ }
    throw ultimo;
  }

  window.Dados = {
    resolverImagem,
    async carregar(aba) {
      const { dados, origem } = await buscar();
      return { itens: normalizar(dados[aba]), origem };
    }
  };
})();