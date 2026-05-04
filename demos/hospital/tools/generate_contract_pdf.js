const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'docs', 'contrato-sistema-senhas.pdf');

const paragraphs = [
  'CONTRATO DE LICENCA DE USO DE SOFTWARE (SAAS) E PRESTACAO DE SERVICOS DE SUPORTE TECNICO',
  '',
  'CONTRATADO: CARLOS MAGNO LIMA DO NASCIMENTO, inscrito no CPF sob o n 050.831.552-22, residente e domiciliado em Porto Velho - RO.',
  '',
  'CONTRATANTE: [NOME DA EMPRESA/CLIENTE], inscrito no CNPJ/CPF sob o n [NUMERO], com sede em [ENDERECO COMPLETO], representado neste ato por [NOME DO REPRESENTANTE], [CARGO].',
  '',
  'CLAUSULA PRIMEIRA - DO OBJETO E FUNCIONALIDADES',
  '1.1. O CONTRATADO concede a CONTRATANTE licenca de uso, em carater nao exclusivo e intransferivel, de software de gestao de sua propriedade exclusiva.',
  '1.2. O software contempla as seguintes funcionalidades de gestao de fluxo e atendimento: Dashboard de indicadores, Gerenciamento e Visualizacao de Filas, Cadastro de Medicos/Profissionais, Gestao de Salas e Setores, Gerenciador de Totem de autoatendimento, Relatorios operacionais, Logs de sistema e interface para Telao de chamadas.',
  '1.3. Implantacao de Novas Abas: A implementacao de novas funcionalidades ou abas seguira o rito de solicitacao formal, aprovacao de requisitos tecnicos e validacao pela CONTRATANTE.',
  '',
  'CLAUSULA SEGUNDA - DOS VALORES, PAGAMENTOS E REAJUSTE',
  '2.1. TAXA DE ADESAO (SETUP): Valor total de R$ 8.000,00, podendo ser pago em duas etapas, sendo R$ 4.000,00 no ato da contratacao (destinado a implantacao e parametrizacao inicial) e R$ 4.000,00 apos a entrega do sistema, ou, alternativamente, o montante total a vista, mediante anexacao do comprovante ao contrato.',
  '2.2. MENSALIDADE/MANUTENCAO (SAAS): Valor de R$ 250,00 (ja incluindo o custo de hospedagem mensal), com vencimento no quinto dia util de cada mes.',
  '2.3. DOMINIO (REGISTRO DE ENDERECO): Valor anual de R$ 40,00 (quarenta reais), referente a renovacao do endereco eletronico (URL) do sistema, com vencimento a cada 12 meses.',
  '2.4. EQUIPAMENTOS E HARDWARE: Caso haja necessidade de aquisicao ou instalacao de qualquer hardware ou equipamento para o pleno funcionamento do sistema, os custos financeiros e a aquisicao serao de responsabilidade exclusiva da CONTRATANTE.',
  '2.5. ADICIONAIS POR FUNCIONALIDADE: Para cada nova aba solicitada e aprovada (conforme item 1.3), sera aplicado um acrescimo de 5% (cinco por cento) sobre o valor da mensalidade vigente.',
  '2.6. INADIMPLENCIA (MULTA DE MORA): O atraso superior a 5 dias podera acarretar suspensao parcial ou total de acesso, alem de multa de 2% sobre o valor devido e juros de 1% ao mes.',
  '',
  'CLAUSULA TERCEIRA - DO TREINAMENTO E PREPARACAO DA EQUIPE',
  '3.1. O CONTRATADO disponibilizara o periodo de 03 (tres) dias de treinamento presencial ou remoto (conforme acordado entre as partes) para a preparacao da equipe da CONTRATANTE, visando a correta operacao do sistema e suas funcionalidades.',
  '3.2. O treinamento abrangera a operacao do Totem, gerenciamento de filas, cadastro de profissionais e leitura de dashboards.',
  '3.3. Caso a CONTRATANTE solicite novos periodos de treinamento apos o prazo inicial estipulado, estes poderao ser objeto de orcamento complementar e nova agenda.',
  '',
  'CLAUSULA QUARTA - DO SUPORTE E NIVEL DE SERVICO (SLA)',
  '4.1. O suporte sera prestado de forma remota, em horario comercial, via WhatsApp ou atraves da ferramenta ANYDESK.',
  '4.2. Disponibilidade (Uptime): O CONTRATADO envidara esforcos para manter a disponibilidade do software em uma media de 99% (noventa e nove por cento) do tempo por mes civil.',
  '4.3. Janelas de Manutencao: Interrupcoes programadas para melhorias e seguranca, comunicadas com ate 24h de antecedencia, nao serao computadas como indisponibilidade.',
  '',
  'CLAUSULA QUINTA - DO BANCO DE DADOS E PROCESSAMENTO DE INFORMACOES',
  '5.1. Autorizacao de Processamento: A CONTRATANTE autoriza o CONTRATADO a realizar o armazenamento e gestao de dados em servidores Cloud para execucao das funcionalidades do sistema.',
  '5.2. Propriedade dos Dados: Todos os dados inseridos no sistema sao de propriedade exclusiva da CONTRATANTE. O CONTRATADO atua como custodiante tecnico e processador dos dados.',
  '5.3. Extracao de Dados: Em caso de rescisao, a CONTRATANTE tera o direito de exportar as tabelas essenciais em formato legivel (.csv ou .sql).',
  '5.4. Confiabilidade de Backup: O CONTRATADO realizara copias de seguranca (backups) automaticas e periodicas dos dados contidos no sistema.',
  '',
  'CLAUSULA SEXTA - DA PROPRIEDADE INTELECTUAL E RESTRICOES',
  '6.1. O software, sua logica, estrutura, layout e codigos-fonte permanecem como propriedade exclusiva do CONTRATADO.',
  '6.2. E vedado a CONTRATANTE realizar engenharia reversa, sublicenciar, copiar ou ceder o acesso a terceiros sem autorizacao previa por escrito.',
  '',
  'CLAUSULA SETIMA - PROTECAO DE DADOS (LGPD) E CONFIDENCIALIDADE',
  '7.1. As partes comprometem-se a cumprir a Lei Geral de Protecao de Dados (Lei n 13.709/2018).',
  '7.2. As partes obrigam-se a manter sigilo absoluto sobre informacoes comerciais, estrategicas ou tecnicas da outra parte a que venham a ter acesso em razao deste contrato.',
  '',
  'CLAUSULA OITAVA - LIMITACAO DE RESPONSABILIDADE E RESCISAO',
  '8.1. O CONTRATADO nao se responsabiliza por falhas decorrentes de instabilidade na internet local, queda de energia ou mau uso do sistema por parte da CONTRATANTE.',
  '8.2. O contrato possui prazo indeterminado, podendo ser rescindido por qualquer parte mediante aviso previo por escrito de 30 dias.',
  '8.3. A responsabilidade civil total do CONTRATADO limita-se ao valor somado das ultimas 3 (tres) mensalidades pagas.',
  '8.4. MULTA CONTRATUAL (RESCISAO ANTECIPADA): Caso a CONTRATANTE rescinda o contrato antes de completar os primeiros 6 (seis) meses de vigencia, devera pagar ao CONTRATADO uma multa equivalente a 20% (vinte por cento) do valor das mensalidades restantes para completar o referido periodo.',
  '',
  'CLAUSULA NONA - DO FORO',
  '9.1. Fica eleito o foro da comarca de Porto Velho - RO para dirimir quaisquer controversias oriundas deste contrato.',
  '',
  'Porto Velho - RO, ______ de __________________ de 2026.',
];

function estimateTextWidth(text) {
  let width = 0;

  for (const char of text) {
    if (char === ' ') {
      width += 0.32;
    } else if ('ilI.,:;!|'.includes(char)) {
      width += 0.28;
    } else if ('mwMW@#%&QOCDG'.includes(char)) {
      width += 0.95;
    } else if ('0123456789'.includes(char)) {
      width += 0.62;
    } else if ('()-_/[]'.includes(char)) {
      width += 0.45;
    } else {
      width += 0.58;
    }
  }

  return width;
}

function wrapText(text, maxWidth = 67) {
  if (!text) return [''];

  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (estimateTextWidth(next) > maxWidth) {
      if (current) {
        lines.push(current);
        current = word;
      } else {
        lines.push(word);
        current = '';
      }
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function escapePdfText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

const allLines = paragraphs.flatMap((p) => wrapText(p));
const linesPerPage = 44;
const pages = [];
for (let i = 0; i < allLines.length; i += linesPerPage) {
  pages.push(allLines.slice(i, i + linesPerPage));
}

const objects = [];
const addObject = (id, body) => objects.push({ id, body });

addObject(1, '<< /Type /Catalog /Pages 2 0 R >>');
addObject(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

const pageIds = [];
let nextId = 4;

for (const pageLines of pages) {
  const pageId = nextId++;
  const contentId = nextId++;
  pageIds.push(pageId);

  const stream = [
    'BT',
    '/F1 11 Tf',
    '14 TL',
    '48 794 Td',
    ...pageLines.flatMap((line, index) => index === 0
      ? [`(${escapePdfText(line)}) Tj`]
      : ['T*', `(${escapePdfText(line)}) Tj`]),
    'ET'
  ].join('\n');

  addObject(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
  addObject(contentId, `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
}

addObject(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);

objects.sort((a, b) => a.id - b.id);

let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
const offsets = [0];

for (const obj of objects) {
  offsets[obj.id] = Buffer.byteLength(pdf, 'latin1');
  pdf += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
}

const startXref = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

fs.writeFileSync(outputPath, Buffer.from(pdf, 'latin1'));
console.log(`PDF gerado em ${outputPath}`);