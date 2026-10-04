// Cole no Apps Script da planilha (Extensões > Apps Script) e publique como Web App
// (Executar como: você | Acesso: qualquer pessoa). Abas esperadas: "Loja" e "Assistencia".

const PREFIXOS = { Loja: 'L', Assistencia: 'A' }; // ids: L001, L002... / A001, A002...

// API: devolve as duas abas em JSON para o site.
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ler = (nome) => {
    const aba = ss.getSheetByName(nome);
    if (!aba) return [];
    const [cab, ...linhas] = aba.getDataRange().getDisplayValues(); // texto como exibido (preço BR intacto)
    return linhas.map((l) => Object.fromEntries(cab.map((c, i) => [String(c).trim(), l[i]])));
  };
  return ContentService.createTextOutput(JSON.stringify({ loja: ler('Loja'), assistencia: ler('Assistencia') }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ID automático: ao preencher o "nome" de uma linha sem id, gera o próximo número da sequência.
// Roda sozinho em edições manuais e colagens (gatilho simples onEdit).
function onEdit(e) {
  if (!e || !e.range) return;
  const aba = e.range.getSheet();
  if (!PREFIXOS[aba.getName()]) return;
  if (e.range.getColumn() > 2 || e.range.getLastColumn() < 2) return; // só se a edição tocou a coluna "nome"
  preencherAba(aba);
}

// Para importações em massa (que não disparam onEdit): execute esta função manualmente.
function preencherIds() {
  Object.keys(PREFIXOS).forEach((nome) => {
    const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
    if (aba) preencherAba(aba);
  });
}

function preencherAba(aba) {
  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const ultima = aba.getLastRow();
    if (ultima < 2) return;
    const ids = aba.getRange(2, 1, ultima - 1, 1).getValues().map((r) => String(r[0]).trim());
    const nomes = aba.getRange(2, 2, ultima - 1, 1).getValues().map((r) => String(r[0]).trim());
    let maior = 0;
    ids.forEach((id) => { const m = id.match(/(\d+)$/); if (m) maior = Math.max(maior, Number(m[1])); });
    let mudou = false;
    const novos = ids.map((id, i) => {
      if (id || !nomes[i]) return [id];
      mudou = true;
      return [PREFIXOS[aba.getName()] + String(++maior).padStart(3, '0')];
    });
    if (mudou) aba.getRange(2, 1, novos.length, 1).setValues(novos);
  } finally {
    lock.releaseLock();
  }
}