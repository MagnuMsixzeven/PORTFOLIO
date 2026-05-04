/**
 * sync.js — Canal de mensagens em tempo real
 *
 * Camadas (em ordem de prioridade):
 *  1. Socket.io   — multi-máquina via servidor Node (Totem ↔ Admin ↔ Telão)
 *  2. BroadcastChannel — mesma máquina, outras abas/janelas
 *  3. localStorage event — fallback cross-tab legado
 */
const SyncBus = (() => {
  const CHANNEL = 'hospital_fila_v1';
  const LS_KEY  = '_fila_bc_last';

  let _ch = null;
  try { _ch = new BroadcastChannel(CHANNEL); } catch(e) {}

  const _handlers = {};
  let _socket = null;
  let _applyingRemote = false; // evita loop: recebeu do servidor → não reenvia

  /** Registra listener. Retorna fn para remover. */
  function on(type, fn) {
    if (!_handlers[type]) _handlers[type] = [];
    _handlers[type].push(fn);
    return () => { _handlers[type] = _handlers[type].filter(h => h !== fn); };
  }

  /** Emite mensagem para todos (local + outras abas + servidor). */
  function emit(type, payload) {
    const msg = { type, payload, ts: Date.now(), _id: Math.random().toString(36).slice(2) };
    // BroadcastChannel → outras abas na mesma máquina
    if (_ch) _ch.postMessage(msg);
    // localStorage → fallback
    try { localStorage.setItem(LS_KEY, JSON.stringify(msg)); } catch(e) {}
    // Local
    _run(msg);
    // Socket.io → outras máquinas via servidor
    if (_socket && _socket.connected) {
      _socket.emit('bus:emit', { type, payload });
    }
  }

  let _lastId = null;
  function _run(msg) {
    if (!msg || msg._id === _lastId) return;
    _lastId = msg._id;
    (_handlers[msg.type] || []).forEach(fn => { try { fn(msg.payload); } catch(e) { console.error('[SyncBus]', e); } });
    (_handlers['*']       || []).forEach(fn => { try { fn(msg.type, msg.payload); } catch(e) {} });
  }

  if (_ch) _ch.onmessage = (e) => _run(e.data);

  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY && e.newValue) {
      try { _run(JSON.parse(e.newValue)); } catch(e) {}
    }
  });

  // ── Socket.io bridge ─────────────────────────────────────────────────────────
  function connectSocket() {
    if (typeof io === 'undefined') return; // socket.io não carregado (arquivo local)

    _socket = io({ reconnectionDelay: 1000, reconnectionDelayMax: 5000 });

    _socket.on('connect', () => {
      console.log('[SyncBus] Socket.io conectado ao servidor:', _socket.id);
      // Registra papel do usuário no servidor após conexão
      _registerRole();
    });
    _socket.on('disconnect', () => {
      console.warn('[SyncBus] Socket.io desconectado. Aguardando reconexão...');
    });

    // TRIGGER: servidor rejeitou uma alteração (ex: prioridade bloqueada)
    _socket.on('trigger:rejected', ({ key, message }) => {
      console.warn('[TRIGGER]', message);
      // Reverte localStorage para o valor devolvido pelo servidor
      // (o servidor envia ls:set logo após com o valor anterior)
      document.dispatchEvent(new CustomEvent('trigger-rejected', { detail: { key, message } }));
    });

    // Servidor envia estado completo ao conectar
    _socket.on('state:full', (state) => {
      _applyingRemote = true;
      Object.entries(state).forEach(([key, value]) => {
        try { localStorage.setItem(key, value); } catch(e) {}
      });
      _applyingRemote = false;
      document.dispatchEvent(new CustomEvent('fila-atualizada'));
    });

    // Outro cliente atualizou uma chave localStorage
    _socket.on('ls:set', ({ key, value }) => {
      _applyingRemote = true;
      try { localStorage.setItem(key, value); } catch(e) {}
      _applyingRemote = false;
      document.dispatchEvent(new CustomEvent('fila-atualizada'));
    });

    // Evento SyncBus de outro cliente (SENHA_CHAMADA, FILA_MUDOU, etc.)
    _socket.on('bus:emit', ({ type, payload }) => {
      _run({ type, payload, _id: Math.random().toString(36).slice(2) });
    });
  }

  // ── Intercepta localStorage.setItem para sincronizar via servidor ────────────
  const _origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    _origSetItem(key, value);
    if (!_applyingRemote && _socket && _socket.connected && key.startsWith('fila_')) {
      _socket.emit('ls:set', { key, value });
    }
  };

  // Conecta ao socket quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectSocket);
  } else {
    connectSocket();
  }

  // Expõe socket para kiosk.js enviar heartbeat via socket
  function getSocket() { return _socket; }

  // Registra papel do socket no servidor
  function _registerRole() {
    if (!_socket || !_socket.connected) return;
    // Lê sessão de auth do Carlos
    const isCarlos = sessionStorage.getItem('fila_auth_carlos') === '1';
    _socket.emit('auth:register', {
      user:   isCarlos ? 'carlos' : 'viewer',
      role:   isCarlos ? 'admin'  : 'viewer',
      secret: 'MagumDSG_',
    });
  }

  function registerRole(user, role) {
    if (!_socket || !_socket.connected) return;
    _socket.emit('auth:register', { user, role, secret: 'MagumDSG_' });
  }

  /** Tipos de mensagem */
  const MSG = {
    SENHA_EMITIDA:   'SENHA_EMITIDA',
    SENHA_CHAMADA:   'SENHA_CHAMADA',
    FILA_MUDOU:      'FILA_MUDOU',
    HB_TOTEM:        'HB_TOTEM',
    HB_TELAO:        'HB_TELAO',
    SERVICO_CHANGED: 'SERVICO_CHANGED',
    CONFIG_CHANGED:  'CONFIG_CHANGED',
  };

  return { on, emit, MSG, getSocket, registerRole };
})();

