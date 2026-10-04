// Cole no Apps Script da planilha (Extensões > Apps Script) e publique como Web App
// (Executar como: você | Acesso: qualquer pessoa). Abas esperadas: "Loja" e "Assistencia".
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
