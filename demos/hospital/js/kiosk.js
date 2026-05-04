/**
 * kiosk.js — Modo Kiosk para Totem Hospitalar
 * Gerencia: fullscreen forçado, bloqueio de teclas/gestos,
 * heartbeat para monitoramento pelo Admin, e leitura de status.
 */
const Kiosk = (() => {

  // ──────────────────────────────────────────────
  // FULLSCREEN
  // ──────────────────────────────────────────────
  function enterFullscreen() {
    const el = document.documentElement;
    const fn = el.requestFullscreen
      || el.webkitRequestFullscreen
      || el.mozRequestFullScreen;
    if (fn) fn.call(el).catch(() => {});
  }

  function watchFullscreen() {
    const tryRestore = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setTimeout(enterFullscreen, 700);
      }
    };
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange']
      .forEach(ev => document.addEventListener(ev, tryRestore));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') tryRestore();
    });
  }

  // ──────────────────────────────────────────────
  // BLOQUEIO DE TECLAS E GESTOS
  // ──────────────────────────────────────────────
  function blockKeys() {
    function trap(e) {
      const blocked =
        (e.altKey  && ['F4', 'Tab', 'F4'].includes(e.key)) ||
        (e.ctrlKey && ['w', 'W', 'u', 'U'].includes(e.key)) ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        ['F12', 'F11', 'F1', 'F2', 'F3', 'F5', 'F6',
         'F7', 'F8', 'F9', 'F10', 'Escape', 'Meta'].includes(e.key);
      if (blocked) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
    document.addEventListener('keydown',     trap, true);
    document.addEventListener('keyup',       trap, true);
    document.addEventListener('contextmenu', e => e.preventDefault());
    // Evita seleção acidental de texto (touchscreen)
    document.addEventListener('selectstart', e => e.preventDefault());
  }

  // ──────────────────────────────────────────────
  // HEARTBEAT — enviado pelo Totem / Telão
  // ──────────────────────────────────────────────
  const HB_PFX = 'fila_hb_';

  function startHeartbeat(id) {
    const key = HB_PFX + id;
    function beat() {
      const data = { ts: Date.now(), alive: true, path: location.pathname };
      localStorage.setItem(key, JSON.stringify(data));
      // Heartbeat via socket.io (multi-máquina)
      if (typeof SyncBus !== 'undefined') {
        const socket = SyncBus.getSocket && SyncBus.getSocket();
        if (socket && socket.connected) socket.emit('heartbeat', { id });
        SyncBus.emit(
          id.startsWith('telao') ? SyncBus.MSG.HB_TELAO : SyncBus.MSG.HB_TOTEM,
          { id, ts: Date.now(), alive: true }
        );
      }
    }
    beat();
    const timer = setInterval(beat, 5000);
    window.addEventListener('beforeunload', () => {
      clearInterval(timer);
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), alive: false }));
    });
    return key;
  }

  // ──────────────────────────────────────────────
  // STATUS — lido pelo Admin
  // ──────────────────────────────────────────────
  const TIMEOUT_MS = 15000; // 15s sem heartbeat = offline

  function getStatus(id) {
    try {
      const raw = localStorage.getItem(HB_PFX + id);
      if (!raw) return { online: false, label: 'Nunca conectado', elapsed: null };
      const d    = JSON.parse(raw);
      const el   = Date.now() - d.ts;
      const online = d.alive === true && el < TIMEOUT_MS;
      const label = online
        ? 'Online · ' + Math.floor(el / 1000) + 's atrás'
        : el < 60000
          ? 'Offline · ' + Math.floor(el / 1000) + 's atrás'
          : 'Offline · ' + Math.floor(el / 60000) + 'min atrás';
      return { online, label, elapsed: el, lastTs: d.ts };
    } catch {
      return { online: false, label: 'Erro ao ler status', elapsed: null };
    }
  }

  // ──────────────────────────────────────────────
  // INIT — chamado pelas páginas
  // ──────────────────────────────────────────────
  /**
   * @param {object} opts
   * @param {boolean}      [opts.fullscreen]   - Ativar fullscreen forçado
   * @param {boolean}      [opts.blockKeys]    - Bloquear atalhos de teclado
   * @param {string|null}  [opts.heartbeatId]  - ID para heartbeat (ex: 'totem-01')
   */
  function init({ fullscreen = false, blockKeys: bk = false, heartbeatId = null } = {}) {
    if (bk) blockKeys();
    if (fullscreen) {
      // Fullscreen exige gesto do usuário — ativa no primeiro toque/clique
      document.addEventListener('click',      enterFullscreen, { once: true });
      document.addEventListener('touchstart', enterFullscreen, { once: true, passive: true });
      watchFullscreen();
    }
    if (heartbeatId) startHeartbeat(heartbeatId);
  }

  return { init, getStatus, enterFullscreen, startHeartbeat };
})();
