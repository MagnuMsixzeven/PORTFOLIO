/**
 * app.js – Lógica central do Sistema de Fila
 * Ass. Zequinha Araújo
 */

const App = (() => {

  const K = {
    FILA:       'fila_senhas',
    MEDICOS:    'fila_medicos',
    SALAS:      'fila_salas',
    ATENDS:     'fila_atendimentos',
    CHAMADA:    'fila_chamada_atual',
    CONTADORES: 'fila_contadores',
    CONFIG:     'fila_config',
    SERVICOS:   'fila_servico_status', // ativo/inativo por tipo no totem
  };

  const load = (k, fb) => {
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : (fb !== undefined ? fb : []); }
    catch { return fb !== undefined ? fb : []; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // -- Contadores de senha (com reset diário) --
  function incContador(prefix) {
    const today = new Date().toDateString();
    const c = load(K.CONTADORES, {});
    // Novo dia: zera todos os contadores exceto a data
    if (c._date && c._date !== today) {
      Object.keys(c).forEach(k => { if (k !== '_date') delete c[k]; });
    }
    c._date  = today;
    c[prefix] = (c[prefix] || 0) + 1;
    save(K.CONTADORES, c);
    return c[prefix];
  }

  // -- Configuracoes --
  const CFG_DEF = {
    demo:         true,
    requireNome:  false,
    autoInterval: 0,
    ticketInfo: {
      linha1: 'Associacao Zequinha Araujo',
      linha2: 'Rua Principal, 123 - Centro',
      linha3: 'Tel: (98) 9999-9999',
      linha4: 'CNPJ: 00.000.000/0001-00',
      rodape: 'Obrigado! Aguarde ser chamado no telao.',
    }
  };

  function getConfig() {
    const s = load(K.CONFIG, {});
    return { ...CFG_DEF, ...s, ticketInfo: { ...CFG_DEF.ticketInfo, ...(s.ticketInfo || {}) } };
  }
  function saveConfig(cfg) { save(K.CONFIG, cfg); }

  // -- Serviços do Totem (ativar/desativar remotamente) --
  function getServicos() { return load(K.SERVICOS, {}); }
  function setServico(nome, ativo) {
    const s = load(K.SERVICOS, {});
    s[nome] = !!ativo;
    save(K.SERVICOS, s);
  }
  function isServicoAtivo(nome) {
    const s = load(K.SERVICOS, {});
    return s[nome] !== false; // default: true (ativo)
  }

  // -- Fila --
  function getFila()         { return load(K.FILA).filter(s => s.status !== 'finalizado'); }
  function getFilaCompleta() { return load(K.FILA); }
  function getSenha(id)      { return load(K.FILA).find(s => s.id === id) || null; }

  function gerarSenha({ nome, tipo, prefix, modalidade, prioritario }) {
    const num   = incContador(prefix);
    const senha = (prioritario ? 'P-' : '') + prefix + '-' + String(num).padStart(3, '0');
    const id    = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const reg   = {
      id, senha,
      nome: nome || 'Paciente', tipo, prefix, modalidade,
      prioritario: !!prioritario,
      emitida: Date.now(), finalizado: null,
      status: 'esperando', sala: '', medico: '', procedimento: ''
    };
    const fila = load(K.FILA);
    fila.push(reg);
    save(K.FILA, fila);
    return reg;
  }

  function setStatus(id, status) {
    const fila = load(K.FILA);
    const idx  = fila.findIndex(s => s.id === id);
    if (idx === -1) return;
    fila[idx].status = status;
    if (status === 'finalizado') fila[idx].finalizado = Date.now();
    save(K.FILA, fila);
  }

  function editarSenha(id, dados) {
    const fila = load(K.FILA);
    const idx  = fila.findIndex(s => s.id === id);
    if (idx === -1) return;
    Object.assign(fila[idx], dados);
    save(K.FILA, fila);
  }

  function remover(id) { save(K.FILA, load(K.FILA).filter(s => s.id !== id)); }
  function zerarFila() { save(K.FILA, []); save(K.CHAMADA, null); save(K.CONTADORES, {}); resetPrioCnt(); }

  // -- Auto Queue: 3 prioritarios : 1 normal --
  let _prioCount = parseInt(sessionStorage.getItem('fila_prio_cnt') || '0');
  function incPrioCnt()   { _prioCount++; sessionStorage.setItem('fila_prio_cnt', String(_prioCount)); }
  function resetPrioCnt() { _prioCount = 0; sessionStorage.setItem('fila_prio_cnt', '0'); }
  function getPrioCount() { return _prioCount; }

  function getProximaAuto() {
    const espera  = load(K.FILA).filter(s => s.status === 'esperando');
    if (!espera.length) return null;
    const prios   = espera.filter(f =>  f.prioritario).sort((a, b) => a.emitida - b.emitida);
    const normais = espera.filter(f => !f.prioritario).sort((a, b) => a.emitida - b.emitida);
    if (_prioCount >= 3 && normais.length) return normais[0];
    if (prios.length) return prios[0];
    return normais[0] || null;
  }

  function getOrdemAuto() {
    const espera  = load(K.FILA).filter(s => s.status === 'esperando');
    const prios   = [...espera.filter(f =>  f.prioritario)].sort((a, b) => a.emitida - b.emitida);
    const normais = [...espera.filter(f => !f.prioritario)].sort((a, b) => a.emitida - b.emitida);
    const result = [];
    let pc = _prioCount, pi = 0, ni = 0;
    while (pi < prios.length || ni < normais.length) {
      if (pc >= 3 && ni < normais.length) {
        result.push({ ...normais[ni++], _isNext: result.length === 0 }); pc = 0;
      } else if (pi < prios.length) {
        result.push({ ...prios[pi++],   _isNext: result.length === 0 }); pc++;
      } else {
        result.push({ ...normais[ni++], _isNext: result.length === 0 }); pc = 0;
      }
    }
    return result;
  }

  function getProxima() { return getProximaAuto(); }

  function chamarProximaAuto() {
    const prox = getProximaAuto();
    if (!prox) return null;
    if (prox.prioritario) incPrioCnt(); else resetPrioCnt();
    setStatus(prox.id, 'chamado');
    setChamadaAtual(prox);
    return prox;
  }

  // -- Stats --
  function getTotalHoje() {
    const d = new Date().toDateString();
    return load(K.FILA).filter(s => new Date(s.emitida).toDateString() === d).length;
  }
  function getAtendidos() {
    const d = new Date().toDateString();
    return load(K.FILA).filter(s =>
      s.status === 'finalizado' && new Date(s.emitida).toDateString() === d
    ).length;
  }
  function getHistorico() { return load(K.FILA); }

  // -- Chamada atual --
  function getChamadaAtual() { return load(K.CHAMADA, null); }
  function setChamadaAtual(d) { save(K.CHAMADA, d || null); }

  // -- CRUD --
  function getMedicos()    { return load(K.MEDICOS); }
  function addMedico(m)    { const l = load(K.MEDICOS); l.push(m); save(K.MEDICOS, l); }
  function removeMedico(i) { const l = load(K.MEDICOS); l.splice(i, 1); save(K.MEDICOS, l); }

  function getSalas()      { return load(K.SALAS); }
  function addSala(s)      { const l = load(K.SALAS); l.push(s); save(K.SALAS, l); }
  function removeSala(i)   { const l = load(K.SALAS); l.splice(i, 1); save(K.SALAS, l); }

  function getAtendimentos()  { return load(K.ATENDS); }
  function addAtend(a)        { const l = load(K.ATENDS); l.push(a); save(K.ATENDS, l); }
  function removeAtend(i)     { const l = load(K.ATENDS); l.splice(i, 1); save(K.ATENDS, l); }

  // -- Prontuários --
  const K_PRONT = 'fila_prontuarios';
  function getProntuarios() { return load(K_PRONT); }
  function addProntuario(p) {
    const lista = load(K_PRONT);
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : (Date.now().toString(36) + Math.random().toString(36).slice(2));
    const reg = { id, ...p, criadoEm: Date.now(), presenca: Date.now() };
    lista.push(reg);
    save(K_PRONT, lista);
    return reg;
  }
  function updateProntuario(id, dados) {
    const lista = load(K_PRONT);
    const idx = lista.findIndex(p => p.id === id);
    if (idx === -1) return;
    Object.assign(lista[idx], dados, { atualizadoEm: Date.now() });
    save(K_PRONT, lista);
  }
  function removeProntuario(id) { save(K_PRONT, load(K_PRONT).filter(p => p.id !== id)); }

  window.addEventListener('storage', () =>
    document.dispatchEvent(new CustomEvent('fila-atualizada'))
  );

  return {
    getFila, getFilaCompleta, getSenha, gerarSenha,
    setStatus, editarSenha, remover, zerarFila,
    getProxima, getProximaAuto, getOrdemAuto, chamarProximaAuto, getPrioCount,
    getTotalHoje, getAtendidos, getHistorico,
    getChamadaAtual, setChamadaAtual,
    getMedicos, addMedico, removeMedico,
    getSalas, addSala, removeSala,
    getAtendimentos, addAtend, removeAtend,
    getConfig, saveConfig,
    getServicos, setServico, isServicoAtivo,
    getProntuarios, addProntuario, updateProntuario, removeProntuario,
  };

})();
