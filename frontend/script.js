// =============================================================================
// ColodelBot — frontend
// Arquivo único, organizado em seções. Gerencia: conversas múltiplas
// (localStorage), sidebar (busca, fixar, lixeira, seleção múltipla),
// streaming de resposta (SSE), upload de imagem, markdown, memória de
// longo prazo, personalidade configurável, tema claro/escuro, humores do
// robô, sons e toasts.
// =============================================================================

// -----------------------------------------------------------------------
// Constantes
// -----------------------------------------------------------------------

const STORAGE_CONVERSAS = "colodelbot:conversations:v2";
const STORAGE_SETTINGS = "colodelbot:settings:v1";
const STORAGE_MEMORY = "colodelbot:memory:v1";

const TAMANHO_MAX_HISTORICO = 12;
const DIAS_ATE_PURGAR_LIXEIRA = 7;
const MS_ATE_DORMIR = 90 * 1000; // inatividade até o robô "dormir"
const LARGURA_MAX_IMAGEM = 640; // redimensionamento antes de enviar/guardar

const MENSAGEM_BOAS_VINDAS =
  "Oi! Eu sou o ColodelBot 👋 Pode me perguntar qualquer coisa.";

const FRASES_CUTUCAR = [
  "Oi de novo! 👀",
  "Pode perguntar, eu tô aqui.",
  "Bipe bop. Tudo certo por aqui.",
  "Bora trocar uma ideia?",
  "Manda a pergunta!",
];

const FRASES_RATE_LIMIT = [
  "Calma aí! Espera um pouquinho 😤",
  "Devagar! Deixa eu respirar.",
  "Muitas mensagens de uma vez, hein?",
];

// -----------------------------------------------------------------------
// Referências de elementos
// -----------------------------------------------------------------------

const chatLog = document.getElementById("chatLog");
const form = document.getElementById("composerForm");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const suggestions = document.getElementById("suggestions");

const dome = document.getElementById("dome");
const robotButton = document.getElementById("robotButton");
const robotPulse = document.getElementById("robotPulse");
const robotSparks = document.getElementById("robotSparks");
const robotSpeech = document.getElementById("robotSpeech");

const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

const hudSession = document.getElementById("hudSession");
const hudMessages = document.getElementById("hudMessages");
const hudStatus = document.getElementById("hudStatus");

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const pinnedList = document.getElementById("pinnedList");
const conversationList = document.getElementById("conversationList");
const trashList = document.getElementById("trashList");
const trashToggle = document.getElementById("trashToggle");
const trashChevron = document.getElementById("trashChevron");
const newChatButton = document.getElementById("newChatButton");
const searchInput = document.getElementById("searchInput");
const selectModeButton = document.getElementById("selectModeButton");
const bulkBar = document.getElementById("bulkBar");
const bulkCount = document.getElementById("bulkCount");
const bulkDeleteButton = document.getElementById("bulkDeleteButton");
const bulkCancelButton = document.getElementById("bulkCancelButton");

const themeToggle = document.getElementById("themeToggle");
const settingsToggle = document.getElementById("settingsToggle");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsClose = document.getElementById("settingsClose");
const presetGrid = document.getElementById("presetGrid");
const personalityInput = document.getElementById("personalityInput");
const soundToggle = document.getElementById("soundToggle");
const memoryList = document.getElementById("memoryList");
const memoryCount = document.getElementById("memoryCount");
const clearMemoryButton = document.getElementById("clearMemoryButton");

const contextMenu = document.getElementById("contextMenu");
const toastStack = document.getElementById("toastStack");

const attachButton = document.getElementById("attachButton");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewImg = document.getElementById("imagePreviewImg");
const imagePreviewRemove = document.getElementById("imagePreviewRemove");

const eyeGroupL = document.getElementById("eyeGroupL");
const eyeGroupR = document.getElementById("eyeGroupR");

// -----------------------------------------------------------------------
// Configurações (tema, personalidade, som)
// -----------------------------------------------------------------------

let settings = carregarSettings();

function carregarSettings() {
  try {
    const bruto = localStorage.getItem(STORAGE_SETTINGS);
    const dados = bruto ? JSON.parse(bruto) : {};
    return {
      theme: dados.theme === "light" ? "light" : "dark",
      personality: typeof dados.personality === "string" ? dados.personality : "",
      soundOn: dados.soundOn !== false,
    };
  } catch {
    return { theme: "dark", personality: "", soundOn: true };
  }
}

function salvarSettings() {
  try {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
  } catch {
    // silencioso — configurações voltam ao padrão na próxima sessão
  }
}

function aplicarTema() {
  document.documentElement.setAttribute("data-theme", settings.theme);
}

aplicarTema();

themeToggle.addEventListener("click", () => {
  settings.theme = settings.theme === "dark" ? "light" : "dark";
  aplicarTema();
  salvarSettings();
});

// -----------------------------------------------------------------------
// Memória de longo prazo (fatos sobre o usuário, entre conversas)
// -----------------------------------------------------------------------

let memorias = carregarMemorias();

function carregarMemorias() {
  try {
    const bruto = localStorage.getItem(STORAGE_MEMORY);
    const dados = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvarMemorias() {
  try {
    localStorage.setItem(STORAGE_MEMORY, JSON.stringify(memorias));
  } catch {
    // silencioso
  }
}

function adicionarMemoria(fato) {
  if (!fato || memorias.includes(fato)) return;
  memorias.push(fato);
  if (memorias.length > 60) memorias.shift(); // evita crescer sem limite
  salvarMemorias();
  renderizarMemorias();
  mostrarToast(`Nova memória salva: "${resumir(fato, 44)}"`);
}

function removerMemoria(indice) {
  memorias.splice(indice, 1);
  salvarMemorias();
  renderizarMemorias();
}

function renderizarMemorias() {
  memoryCount.textContent = String(memorias.length);
  memoryList.innerHTML = "";

  if (memorias.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "memory-empty";
    vazio.textContent = "Nenhuma memória ainda. Converse um pouco que eu aprendo!";
    memoryList.appendChild(vazio);
    return;
  }

  memorias.forEach((fato, indice) => {
    const item = document.createElement("div");
    item.className = "memory-item";

    const texto = document.createElement("span");
    texto.textContent = fato;

    const excluir = document.createElement("button");
    excluir.setAttribute("aria-label", "Excluir memória");
    excluir.innerHTML =
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    excluir.addEventListener("click", () => removerMemoria(indice));

    item.appendChild(texto);
    item.appendChild(excluir);
    memoryList.appendChild(item);
  });
}

clearMemoryButton.addEventListener("click", () => {
  if (memorias.length === 0) return;
  memorias = [];
  salvarMemorias();
  renderizarMemorias();
  mostrarToast("Todas as memórias foram apagadas");
});

// -----------------------------------------------------------------------
// Estado das conversas
// -----------------------------------------------------------------------

let state = carregarEstado() || criarEstadoInicial();
let aguardandoResposta = false;
let modoSelecao = false;
let selecionadas = new Set();
let anexoImagem = null; // { mimeType, data (base64 sem prefixo), previewUrl }

purgarLixeiraAntiga();
salvarEstado();

function carregarEstado() {
  try {
    const bruto = localStorage.getItem(STORAGE_CONVERSAS);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (!dados || !Array.isArray(dados.conversations)) return null;
    return dados;
  } catch {
    return null;
  }
}

function salvarEstado() {
  try {
    localStorage.setItem(STORAGE_CONVERSAS, JSON.stringify(state));
  } catch {
    mostrarToast("Não consegui salvar — armazenamento local cheio ou bloqueado");
  }
}

function criarEstadoInicial() {
  const conversa = novaConversa();
  return { activeId: conversa.id, conversations: [conversa] };
}

function novaConversa() {
  const agora = Date.now();
  return {
    id: gerarId(),
    title: "Nova conversa",
    titleAuto: true,
    createdAt: agora,
    updatedAt: agora,
    pinned: false,
    deletedAt: null,
    messages: [{ role: "bot", text: MENSAGEM_BOAS_VINDAS, time: agora }],
  };
}

function gerarId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function conversaAtiva() {
  return state.conversations.find((c) => c.id === state.activeId) || state.conversations[0];
}

function purgarLixeiraAntiga() {
  const limiteMs = DIAS_ATE_PURGAR_LIXEIRA * 24 * 60 * 60 * 1000;
  const agora = Date.now();
  state.conversations = state.conversations.filter(
    (c) => !c.deletedAt || agora - c.deletedAt < limiteMs
  );
  if (!state.conversations.some((c) => c.id === state.activeId)) {
    const disponivel = state.conversations.find((c) => !c.deletedAt);
    if (disponivel) {
      state.activeId = disponivel.id;
    } else {
      const conversa = novaConversa();
      state.conversations.push(conversa);
      state.activeId = conversa.id;
    }
  }
}

// -----------------------------------------------------------------------
// Ícone automático da conversa (baseado no primeiro assunto)
// -----------------------------------------------------------------------

const ICONES = {
  code: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M9 6L3 12L9 18M15 6L21 12L15 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  image: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.8"/><circle cx="9" cy="10" r="1.6" fill="currentColor"/><path d="M21 16L15.5 11L6 20" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 5H20V16H8L4 20V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
};

function iconeDaConversa(conversa) {
  if (conversa.messages.some((m) => m.image)) return ICONES.image;
  const primeira = conversa.messages.find((m) => m.role === "user");
  if (primeira && /código|function|bug|javascript|python|programa|api|html|css|sql|git|typescript|react|node/i.test(primeira.text)) {
    return ICONES.code;
  }
  return ICONES.chat;
}

// -----------------------------------------------------------------------
// Sidebar — renderização (fixadas / recentes / lixeira)
// -----------------------------------------------------------------------

function renderizarSidebar() {
  const termo = searchInput.value.trim().toLowerCase();

  const ativas = state.conversations.filter((c) => !c.deletedAt);
  const apagadas = state.conversations.filter((c) => c.deletedAt);

  const filtrar = (lista) =>
    termo
      ? lista.filter(
          (c) =>
            c.title.toLowerCase().includes(termo) ||
            c.messages.some((m) => m.text && m.text.toLowerCase().includes(termo))
        )
      : lista;

  const fixadas = filtrar(ativas.filter((c) => c.pinned)).sort((a, b) => b.updatedAt - a.updatedAt);
  const recentes = filtrar(ativas.filter((c) => !c.pinned)).sort((a, b) => b.updatedAt - a.updatedAt);
  const lixeira = filtrar(apagadas).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));

  pinnedList.innerHTML = "";
  conversationList.innerHTML = "";
  trashList.innerHTML = "";

  fixadas.forEach((c) => pinnedList.appendChild(criarItemSidebar(c, false)));
  recentes.forEach((c) => conversationList.appendChild(criarItemSidebar(c, false)));
  lixeira.forEach((c) => trashList.appendChild(criarItemSidebar(c, true)));

  atualizarBarraSelecao();
}

function criarItemSidebar(conversa, ehLixeira) {
  const item = document.createElement("div");
  item.className =
    "conv-item" +
    (conversa.id === state.activeId ? " is-active" : "") +
    (ehLixeira ? " conv-item--trashed" : "");
  item.dataset.id = conversa.id;
  item.style.position = "relative";

  if (modoSelecao && !ehLixeira) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "conv-item__checkbox";
    checkbox.checked = selecionadas.has(conversa.id);
    checkbox.addEventListener("click", (e) => e.stopPropagation());
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selecionadas.add(conversa.id);
      else selecionadas.delete(conversa.id);
      atualizarBarraSelecao();
    });
    item.appendChild(checkbox);
  }

  const row = document.createElement("div");
  row.className = "conv-item__row";

  const icone = document.createElement("span");
  icone.className = "conv-item__icon";
  icone.innerHTML = iconeDaConversa(conversa);
  row.appendChild(icone);

  const titulo = document.createElement("span");
  titulo.className = "conv-item__title";
  titulo.textContent = conversa.title;
  row.appendChild(titulo);

  if (conversa.pinned && !ehLixeira) {
    const pin = document.createElement("span");
    pin.className = "conv-item__pin";
    pin.innerHTML =
      '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 2L14 8L20 9L15.5 13L17 20L12 16.5L7 20L8.5 13L4 9L10 8Z"/></svg>';
    row.appendChild(pin);
  }

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "2px";
  wrapper.style.flex = "1";
  wrapper.style.minWidth = "0";
  wrapper.appendChild(row);

  const tempo = document.createElement("span");
  tempo.className = "conv-item__time";
  tempo.textContent = ehLixeira ? `apagada ${tempoRelativo(conversa.deletedAt)}` : tempoRelativo(conversa.updatedAt);
  wrapper.appendChild(tempo);

  item.appendChild(wrapper);

  const acoes = document.createElement("div");
  acoes.className = "conv-item__actions";

  if (ehLixeira) {
    const restaurar = document.createElement("button");
    restaurar.setAttribute("aria-label", "Restaurar conversa");
    restaurar.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 12A8 8 0 1 1 6.5 17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 8V13H9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    restaurar.addEventListener("click", (e) => {
      e.stopPropagation();
      restaurarConversa(conversa.id);
    });

    const excluirDef = document.createElement("button");
    excluirDef.setAttribute("aria-label", "Excluir definitivamente");
    excluirDef.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M5 6H19M9 6V4H15V6M7 6L8 20H16L17 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    excluirDef.addEventListener("click", (e) => {
      e.stopPropagation();
      excluirDefinitivamente(conversa.id);
    });

    acoes.appendChild(restaurar);
    acoes.appendChild(excluirDef);
  } else {
    const excluir = document.createElement("button");
    excluir.setAttribute("aria-label", "Mover pra lixeira");
    excluir.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M5 6H19M9 6V4H15V6M7 6L8 20H16L17 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    excluir.addEventListener("click", (e) => {
      e.stopPropagation();
      moverParaLixeira(conversa.id);
    });
    acoes.appendChild(excluir);
  }

  item.appendChild(acoes);

  item.addEventListener("click", () => {
    if (ehLixeira) return;
    if (modoSelecao) {
      const cb = item.querySelector(".conv-item__checkbox");
      if (cb) cb.click();
      return;
    }
    trocarConversa(conversa.id);
  });

  if (!ehLixeira) {
    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      abrirMenuContexto(e.clientX, e.clientY, conversa.id);
    });
  }

  return item;
}

function tempoRelativo(timestamp) {
  if (!timestamp) return "";
  const diffMin = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return new Date(timestamp).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

searchInput.addEventListener("input", renderizarSidebar);

// -----------------------------------------------------------------------
// Ações sobre conversas
// -----------------------------------------------------------------------

function trocarConversa(id) {
  if (aguardandoResposta || id === state.activeId) return;
  state.activeId = id;
  salvarEstado();
  renderizarSidebar();
  renderizarConversaAtiva();
  atualizarHud();
  fecharSidebarMobile();
}

function moverParaLixeira(id) {
  const conversa = state.conversations.find((c) => c.id === id);
  if (!conversa) return;
  conversa.deletedAt = Date.now();
  conversa.pinned = false;

  if (state.activeId === id) {
    const proxima = state.conversations.find((c) => !c.deletedAt);
    if (proxima) {
      state.activeId = proxima.id;
    } else {
      const nova = novaConversa();
      state.conversations.push(nova);
      state.activeId = nova.id;
    }
  }

  salvarEstado();
  renderizarSidebar();
  renderizarConversaAtiva();
  atualizarHud();
  mostrarToast("Conversa movida pra lixeira");
}

function restaurarConversa(id) {
  const conversa = state.conversations.find((c) => c.id === id);
  if (!conversa) return;
  conversa.deletedAt = null;
  conversa.updatedAt = Date.now();
  salvarEstado();
  renderizarSidebar();
  mostrarToast("Conversa restaurada");
}

function excluirDefinitivamente(id) {
  state.conversations = state.conversations.filter((c) => c.id !== id);
  salvarEstado();
  renderizarSidebar();
  mostrarToast("Conversa excluída definitivamente");
}

function alternarFixar(id) {
  const conversa = state.conversations.find((c) => c.id === id);
  if (!conversa) return;
  conversa.pinned = !conversa.pinned;
  salvarEstado();
  renderizarSidebar();
  mostrarToast(conversa.pinned ? "Conversa fixada" : "Conversa desafixada");
}

function duplicarConversa(id) {
  const original = state.conversations.find((c) => c.id === id);
  if (!original) return;
  const copia = {
    ...original,
    id: gerarId(),
    title: original.title + " (cópia)",
    pinned: false,
    deletedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: original.messages.map((m) => ({ ...m })),
  };
  state.conversations.push(copia);
  state.activeId = copia.id;
  salvarEstado();
  renderizarSidebar();
  renderizarConversaAtiva();
  atualizarHud();
  mostrarToast("Conversa duplicada");
}

function renomearConversa(id, novoTitulo) {
  const conversa = state.conversations.find((c) => c.id === id);
  if (!conversa || !novoTitulo || !novoTitulo.trim()) return;
  conversa.title = novoTitulo.trim().slice(0, 60);
  conversa.titleAuto = false;
  salvarEstado();
  renderizarSidebar();
}

function exportarConversa(id) {
  const conversa = state.conversations.find((c) => c.id === id);
  if (!conversa) return;

  const linhas = [`# ${conversa.title}`, ""];
  for (const m of conversa.messages) {
    const autor = m.role === "user" ? "**Você**" : "**ColodelBot**";
    const hora = new Date(m.time).toLocaleString("pt-BR");
    linhas.push(`${autor} · _${hora}_`, "", m.text, "");
  }

  const blob = new Blob([linhas.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${conversa.title.replace(/[^\w\-]+/g, "_")}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  mostrarToast("Conversa exportada");
}

newChatButton.addEventListener("click", () => {
  if (aguardandoResposta) return;
  const conversa = novaConversa();
  state.conversations.push(conversa);
  state.activeId = conversa.id;
  salvarEstado();
  renderizarSidebar();
  renderizarConversaAtiva();
  atualizarHud();
  fecharSidebarMobile();
  input.focus();
});

// -----------------------------------------------------------------------
// Seleção múltipla + exclusão em lote
// -----------------------------------------------------------------------

selectModeButton.addEventListener("click", () => {
  modoSelecao = !modoSelecao;
  selecionadas.clear();
  selectModeButton.classList.toggle("is-active", modoSelecao);
  selectModeButton.textContent = modoSelecao ? "Cancelar" : "Selecionar";
  renderizarSidebar();
});

function atualizarBarraSelecao() {
  bulkBar.hidden = !modoSelecao || selecionadas.size === 0;
  bulkCount.textContent = `${selecionadas.size} selecionada${selecionadas.size === 1 ? "" : "s"}`;
}

bulkDeleteButton.addEventListener("click", () => {
  selecionadas.forEach((id) => {
    const conversa = state.conversations.find((c) => c.id === id);
    if (conversa) {
      conversa.deletedAt = Date.now();
      conversa.pinned = false;
    }
  });

  if (selecionadas.has(state.activeId)) {
    const proxima = state.conversations.find((c) => !c.deletedAt);
    state.activeId = proxima ? proxima.id : (() => {
      const nova = novaConversa();
      state.conversations.push(nova);
      return nova.id;
    })();
  }

  mostrarToast(`${selecionadas.size} conversa(s) movida(s) pra lixeira`);
  selecionadas.clear();
  modoSelecao = false;
  selectModeButton.classList.remove("is-active");
  selectModeButton.textContent = "Selecionar";
  salvarEstado();
  renderizarSidebar();
  renderizarConversaAtiva();
  atualizarHud();
});

bulkCancelButton.addEventListener("click", () => {
  modoSelecao = false;
  selecionadas.clear();
  selectModeButton.classList.remove("is-active");
  selectModeButton.textContent = "Selecionar";
  renderizarSidebar();
});

// -----------------------------------------------------------------------
// Lixeira — colapsar/expandir
// -----------------------------------------------------------------------

trashToggle.addEventListener("click", () => {
  const aberta = !trashList.hidden;
  trashList.hidden = aberta;
  trashToggle.classList.toggle("is-open", !aberta);
});

// -----------------------------------------------------------------------
// Menu de contexto (botão direito numa conversa)
// -----------------------------------------------------------------------

let idContexto = null;

function abrirMenuContexto(x, y, id) {
  idContexto = id;
  const conversa = state.conversations.find((c) => c.id === id);

  const botaoFixar = contextMenu.querySelector('[data-action="pin"]');
  if (botaoFixar && conversa) {
    botaoFixar.textContent = conversa.pinned ? "Desafixar" : "Fixar";
  }

  contextMenu.hidden = false;
  const larguraJanela = window.innerWidth;
  const alturaJanela = window.innerHeight;
  const larguraMenu = 170;
  const alturaMenu = 190;

  contextMenu.style.left = Math.min(x, larguraJanela - larguraMenu - 8) + "px";
  contextMenu.style.top = Math.min(y, alturaJanela - alturaMenu - 8) + "px";
}

function fecharMenuContexto() {
  contextMenu.hidden = true;
  idContexto = null;
}

document.addEventListener("click", (e) => {
  if (!contextMenu.hidden && !contextMenu.contains(e.target)) fecharMenuContexto();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharMenuContexto();
});

contextMenu.addEventListener("click", (e) => {
  const botao = e.target.closest("button[data-action]");
  if (!botao || !idContexto) return;
  const acao = botao.dataset.action;
  const id = idContexto;
  fecharMenuContexto();

  if (acao === "rename") {
    const conversa = state.conversations.find((c) => c.id === id);
    const novo = prompt("Novo nome da conversa:", conversa ? conversa.title : "");
    if (novo !== null) renomearConversa(id, novo);
  } else if (acao === "pin") {
    alternarFixar(id);
  } else if (acao === "duplicate") {
    duplicarConversa(id);
  } else if (acao === "export") {
    exportarConversa(id);
  } else if (acao === "delete") {
    moverParaLixeira(id);
  }
});

// -----------------------------------------------------------------------
// Abrir/fechar sidebar (colapsa no desktop, overlay no mobile)
// -----------------------------------------------------------------------

const mediaMobile = window.matchMedia("(max-width: 900px)");

sidebarToggle.addEventListener("click", () => {
  if (mediaMobile.matches) {
    document.body.classList.toggle("sidebar-open");
  } else {
    document.body.classList.toggle("sidebar-collapsed");
  }
});

sidebarBackdrop.addEventListener("click", fecharSidebarMobile);

function fecharSidebarMobile() {
  document.body.classList.remove("sidebar-open");
}

// -----------------------------------------------------------------------
// Markdown (marked + DOMPurify) com blocos de código copiáveis
// -----------------------------------------------------------------------

const rendererMarkdown = new marked.Renderer();
rendererMarkdown.code = (code, lang) => {
  const texto = typeof code === "string" ? code : code.text || "";
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const rotulo = (lang || (code && code.lang) || "código").toString().slice(0, 20);
  return `<div class="code-block"><div class="code-block__head"><span>${rotulo}</span><button type="button" class="code-block__copy">Copiar</button></div><pre><code>${escapado}</code></pre></div>`;
};
marked.use({ renderer: rendererMarkdown, breaks: true });

function renderMarkdown(texto) {
  try {
    const html = marked.parse(texto);
    return DOMPurify.sanitize(html);
  } catch {
    return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

// clique em "Copiar" dentro de blocos de código (delegação de evento)
chatLog.addEventListener("click", (e) => {
  const botao = e.target.closest(".code-block__copy");
  if (!botao) return;
  const codigo = botao.closest(".code-block").querySelector("code").textContent;
  navigator.clipboard.writeText(codigo).then(() => mostrarToast("Código copiado"));
});

// -----------------------------------------------------------------------
// Renderização do chat
// -----------------------------------------------------------------------

function formatarHora(timestamp) {
  return new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function resumir(texto, limite = 90) {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > limite ? limpo.slice(0, limite).trim() + "…" : limpo;
}

function renderizarConversaAtiva() {
  const conversa = conversaAtiva();
  chatLog.innerHTML = "";

  conversa.messages.forEach((msg, indice) => {
    chatLog.appendChild(criarLinhaMensagem(msg, indice, conversa.messages.length));
  });

  const temPerguntaDoUsuario = conversa.messages.some((m) => m.role === "user");
  suggestions.style.display = temPerguntaDoUsuario ? "none" : "flex";

  rolarParaFinal();
}

function criarLinhaMensagem(msg, indice, total) {
  const ehUsuario = msg.role === "user";
  const ehUltimoBot = !ehUsuario && !msg.erro && indice === total - 1;

  const row = document.createElement("div");
  row.className = `msg-row msg-row--${ehUsuario ? "user" : "bot"}`;

  const avatar = document.createElement("div");
  avatar.className = `avatar avatar--${ehUsuario ? "user" : "bot"}`;
  avatar.textContent = ehUsuario ? "EU" : "CB";
  row.appendChild(avatar);

  const col = document.createElement("div");
  col.className = "msg-col";

  const bolha = document.createElement("div");
  bolha.className = `msg msg--${msg.erro ? "error" : ehUsuario ? "user" : "bot"}`;

  if (msg.image) {
    const img = document.createElement("img");
    img.className = "msg__image";
    img.src = `data:${msg.image.mimeType};base64,${msg.image.data}`;
    img.alt = "Imagem enviada";
    bolha.appendChild(img);
  }

  const conteudo = document.createElement("span");
  conteudo.className = "msg__content";
  if (ehUsuario || msg.erro) {
    conteudo.textContent = msg.text;
  } else {
    conteudo.innerHTML = renderMarkdown(msg.text);
  }
  bolha.appendChild(conteudo);

  const meta = document.createElement("span");
  meta.className = "msg__meta";
  meta.textContent = formatarHora(msg.time) + (msg.edited ? " · editada" : "");
  bolha.appendChild(meta);

  col.appendChild(bolha);

  const acoes = document.createElement("div");
  acoes.className = "msg-actions";

  const btnCopiar = document.createElement("button");
  btnCopiar.setAttribute("aria-label", "Copiar mensagem");
  btnCopiar.innerHTML =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 8V6C16 4.9 15.1 4 14 4H6C4.9 4 4 4.9 4 6V14C4 15.1 4.9 16 6 16H8" stroke="currentColor" stroke-width="1.6"/></svg>';
  btnCopiar.addEventListener("click", () => {
    navigator.clipboard.writeText(msg.text).then(() => mostrarToast("Mensagem copiada"));
  });
  acoes.appendChild(btnCopiar);

  if (ehUsuario) {
    const btnEditar = document.createElement("button");
    btnEditar.setAttribute("aria-label", "Editar mensagem");
    btnEditar.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 20L4.6 16.8L16 5.4C16.6 4.8 17.6 4.8 18.2 5.4L18.6 5.8C19.2 6.4 19.2 7.4 18.6 8L7.2 19.4L4 20Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    btnEditar.addEventListener("click", () => entrarModoEdicao(row, bolha, indice, msg));
    acoes.appendChild(btnEditar);
  }

  if (ehUltimoBot) {
    const btnRegenerar = document.createElement("button");
    btnRegenerar.setAttribute("aria-label", "Regenerar resposta");
    btnRegenerar.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M4 12A8 8 0 1 1 6.5 17.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M4 8V13H9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    btnRegenerar.addEventListener("click", regenerar);
    acoes.appendChild(btnRegenerar);
  }

  col.appendChild(acoes);
  row.appendChild(col);
  return row;
}

function entrarModoEdicao(row, bolha, indice, msg) {
  if (aguardandoResposta) return;

  const area = document.createElement("textarea");
  area.className = "msg-edit-area";
  area.value = msg.text;

  const acoesEdicao = document.createElement("div");
  acoesEdicao.className = "msg-edit-actions";

  const btnCancelar = document.createElement("button");
  btnCancelar.type = "button";
  btnCancelar.textContent = "Cancelar";
  btnCancelar.addEventListener("click", () => renderizarConversaAtiva());

  const btnEnviar = document.createElement("button");
  btnEnviar.type = "button";
  btnEnviar.className = "primary";
  btnEnviar.textContent = "Salvar e reenviar";
  btnEnviar.addEventListener("click", () => {
    const novoTexto = area.value.trim();
    if (!novoTexto) return;
    confirmarEdicao(indice, novoTexto, msg.image || null);
  });

  acoesEdicao.appendChild(btnCancelar);
  acoesEdicao.appendChild(btnEnviar);

  bolha.replaceWith(area);
  row.querySelector(".msg-col").appendChild(acoesEdicao);
  area.focus();
}

function confirmarEdicao(indice, novoTexto, imagemOriginal) {
  const conversa = conversaAtiva();
  conversa.messages = conversa.messages.slice(0, indice);
  salvarEstado();
  renderizarConversaAtiva();
  enviarMensagem(novoTexto, imagemOriginal, { edited: true });
}

// -----------------------------------------------------------------------
// HUD (dados reais da sessão atual)
// -----------------------------------------------------------------------

function atualizarHud() {
  const conversa = conversaAtiva();
  hudSession.textContent = conversa.id.slice(0, 6).toUpperCase();
  hudMessages.textContent = String(conversa.messages.length);
}

function definirHudStatus(texto) {
  hudStatus.textContent = texto;
}

// -----------------------------------------------------------------------
// Título automático (gerado pela IA após a primeira troca de mensagens)
// -----------------------------------------------------------------------

async function gerarTituloSeNecessario(conversa) {
  if (!conversa.titleAuto) return;
  if (conversa.messages.filter((m) => m.role === "user").length !== 1) return; // só na primeira mensagem

  const primeiraUser = conversa.messages.find((m) => m.role === "user");
  if (!primeiraUser) return;

  try {
    const resposta = await fetch("/api/chat/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagemUsuario: primeiraUser.text }),
    });
    const dados = await resposta.json().catch(() => ({}));
    if (dados.titulo && conversa.titleAuto) {
      conversa.title = dados.titulo;
      salvarEstado();
      renderizarSidebar();
    }
  } catch {
    // se falhar, mantém o título truncado que já foi usado como fallback
  }
}

// -----------------------------------------------------------------------
// Envio de mensagem + streaming da resposta
// -----------------------------------------------------------------------

function adicionarMensagemState(role, texto, extras = {}) {
  const conversa = conversaAtiva();
  const agora = Date.now();
  conversa.messages.push({ role, text: texto, time: agora, ...extras });
  conversa.updatedAt = agora;

  if (role === "user" && conversa.titleAuto && conversa.title === "Nova conversa") {
    conversa.title = resumir(texto, 34);
  }

  salvarEstado();
}

function enviarMensagem(texto, imagem, extras = {}) {
  if (aguardandoResposta || !texto || !texto.trim()) return;

  adicionarMensagemState("user", texto.trim(), {
    image: imagem || undefined,
    edited: extras.edited || undefined,
  });

  renderizarConversaAtiva();
  renderizarSidebar();
  atualizarHud();

  input.value = "";
  ajustarAlturaTextarea();
  removerAnexoImagem();
  suggestions.style.display = "none";

  gerarTituloSeNecessario(conversaAtiva());
  solicitarResposta();
}

function construirEsqueletoLinha(role) {
  const row = document.createElement("div");
  row.className = `msg-row msg-row--${role}`;

  const avatar = document.createElement("div");
  avatar.className = `avatar avatar--${role}`;
  avatar.textContent = role === "user" ? "EU" : "CB";
  row.appendChild(avatar);

  const col = document.createElement("div");
  col.className = "msg-col";

  const bolha = document.createElement("div");
  bolha.className = `msg msg--${role}`;

  const conteudo = document.createElement("span");
  conteudo.className = "msg__content";
  bolha.appendChild(conteudo);

  col.appendChild(bolha);
  row.appendChild(col);

  return { row, bolha, conteudo };
}

async function solicitarResposta() {
  const conversa = conversaAtiva();
  const todas = conversa.messages;
  const ultima = todas[todas.length - 1];
  if (!ultima || ultima.role !== "user") return;

  const historicoParaEnviar = todas
    .slice(0, -1)
    .slice(-TAMANHO_MAX_HISTORICO)
    .map((m) => ({ role: m.role, text: m.text }));

  aguardandoResposta = true;
  sendButton.disabled = true;
  sendButton.classList.add("is-sending");
  setTimeout(() => sendButton.classList.remove("is-sending"), 400);
  resetarTimerSono();
  definirEstadoRobo("pensando");

  const esqueleto = construirEsqueletoLinha("bot");
  chatLog.appendChild(esqueleto.row);
  rolarParaFinal();

  let textoAcumulado = "";
  let jaComecouAFalar = false;

  try {
    const resposta = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensagem: ultima.text,
        historico: historicoParaEnviar,
        imagem: ultima.image ? { mimeType: ultima.image.mimeType, data: ultima.image.data } : undefined,
        personalidade: settings.personality,
        memorias,
      }),
    });

    if (resposta.status === 429) {
      const dados = await resposta.json().catch(() => ({}));
      const erro = new Error(dados.erro || "Limite de mensagens atingido.");
      erro.codigo = "RATE_LIMIT";
      throw erro;
    }

    if (!resposta.ok || !resposta.body) {
      const dados = await resposta.json().catch(() => ({}));
      throw new Error(dados.erro || "Não consegui falar com o Gemini agora.");
    }

    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await leitor.read();
      if (done) break;

      buffer += decodificador.decode(value, { stream: true });

      let corte;
      while ((corte = buffer.indexOf("\n\n")) !== -1) {
        const bloco = buffer.slice(0, corte);
        buffer = buffer.slice(corte + 2);

        const linhaDados = bloco.split("\n").find((l) => l.startsWith("data:"));
        if (!linhaDados) continue;

        const jsonTexto = linhaDados.slice(5).trim();
        if (!jsonTexto) continue;

        let evento;
        try {
          evento = JSON.parse(jsonTexto);
        } catch {
          continue;
        }

        if (evento.tipo === "delta") {
          if (!jaComecouAFalar) {
            jaComecouAFalar = true;
            definirEstadoRobo("falando");
          }
          textoAcumulado += evento.trecho;
          esqueleto.conteudo.textContent = textoAcumulado;
          esqueleto.bolha.classList.add("msg--streaming");
          rolarParaFinal();
        } else if (evento.tipo === "fim") {
          textoAcumulado = evento.textoCompleto || textoAcumulado;
          if (evento.memoria) adicionarMemoria(evento.memoria);
        } else if (evento.tipo === "erro") {
          throw new Error(evento.mensagem);
        }
      }
    }

    if (!textoAcumulado) throw new Error("O ColodelBot não respondeu nada. Tenta de novo.");

    esqueleto.row.remove();
    adicionarMensagemState("bot", textoAcumulado);
    renderizarConversaAtiva();
    renderizarSidebar();
    atualizarHud();

    falarBalao(resumir(textoAcumulado, 90));
    setMood("feliz");
    definirEstadoRobo("idle");
    tocarBip();
    dispararFaiscas();
  } catch (erro) {
    esqueleto.row.remove();

    const mensagemErro = erro.message || "Não consegui me conectar agora.";
    adicionarMensagemState("bot", mensagemErro, { erro: true });
    renderizarConversaAtiva();
    renderizarSidebar();

    if (erro.codigo === "RATE_LIMIT") {
      setMood("bravo");
      falarBalao(FRASES_RATE_LIMIT[Math.floor(Math.random() * FRASES_RATE_LIMIT.length)]);
    } else {
      setMood("triste");
      falarBalao("Ops, deu ruim aqui 🔧");
    }
    definirEstadoRobo("idle");
  } finally {
    aguardandoResposta = false;
    sendButton.disabled = false;
    input.focus();
  }
}

function regenerar() {
  if (aguardandoResposta) return;
  const conversa = conversaAtiva();
  const ultima = conversa.messages[conversa.messages.length - 1];
  if (!ultima || ultima.role !== "bot") return;

  conversa.messages.pop();
  salvarEstado();
  renderizarConversaAtiva();
  solicitarResposta();
}

// -----------------------------------------------------------------------
// Formulário / atalhos de teclado / sugestões
// -----------------------------------------------------------------------

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;
  enviarMensagem(texto, anexoImagem);
});

input.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter" && !evento.shiftKey) {
    evento.preventDefault();
    form.requestSubmit();
  }
  resetarTimerSono();
});

input.addEventListener("input", ajustarAlturaTextarea);

suggestions.addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (!chip) return;
  enviarMensagem(chip.dataset.msg, null);
});

function rolarParaFinal() {
  chatLog.scrollTop = chatLog.scrollHeight;
}

function ajustarAlturaTextarea() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 120) + "px";
}

// -----------------------------------------------------------------------
// Upload de imagem
// -----------------------------------------------------------------------

attachButton.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", async () => {
  const arquivo = imageInput.files[0];
  if (!arquivo) return;

  if (!arquivo.type.startsWith("image/")) {
    mostrarToast("Só é possível anexar imagens");
    return;
  }

  try {
    const { dataUrl, base64, mimeType } = await redimensionarImagem(arquivo);
    anexoImagem = { mimeType, data: base64 };
    imagePreviewImg.src = dataUrl;
    imagePreview.hidden = false;
  } catch {
    mostrarToast("Não consegui processar essa imagem");
  }

  imageInput.value = "";
});

imagePreviewRemove.addEventListener("click", removerAnexoImagem);

function removerAnexoImagem() {
  anexoImagem = null;
  imagePreview.hidden = true;
  imagePreviewImg.src = "";
}

function redimensionarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("falha ao ler arquivo"));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("falha ao carregar imagem"));
      img.onload = () => {
        const escala = Math.min(1, LARGURA_MAX_IMAGEM / img.width);
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, largura, altura);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
        const base64 = dataUrl.split(",")[1];
        resolve({ dataUrl, base64, mimeType: "image/jpeg" });
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// -----------------------------------------------------------------------
// Humores do robô (feliz / triste / bravo / dormindo)
// -----------------------------------------------------------------------

const mouthEl = document.getElementById("mouth");

const CAMINHOS_BOCA = {
  feliz: "M104 116 Q120 128 136 116",
  triste: "M104 124 Q120 112 136 124",
  bravo: "M104 122 Q120 117 136 122",
  dormindo: "M110 120 Q120 123 130 120",
};

let humorAtual = "feliz";

function setMood(mood) {
  humorAtual = mood;
  dome.classList.remove("is-angry", "is-sleeping");
  mouthEl.setAttribute("d", CAMINHOS_BOCA[mood] || CAMINHOS_BOCA.feliz);
  if (mood === "bravo") dome.classList.add("is-angry");
  if (mood === "dormindo") dome.classList.add("is-sleeping");
}

let timerSono = null;

function resetarTimerSono() {
  clearTimeout(timerSono);
  if (humorAtual === "dormindo") setMood("feliz");
  timerSono = setTimeout(() => {
    if (!aguardandoResposta) setMood("dormindo");
  }, MS_ATE_DORMIR);
}

// -----------------------------------------------------------------------
// Estados do robô (pensando / falando / idle) + status de conexão
// -----------------------------------------------------------------------

function definirEstadoRobo(estadoAtual) {
  dome.classList.remove("is-thinking", "is-talking");

  if (estadoAtual === "pensando") {
    dome.classList.add("is-thinking");
    statusDot.classList.add("is-busy");
    statusText.textContent = "PENSANDO...";
    definirHudStatus("PENSANDO");
  } else if (estadoAtual === "falando") {
    dome.classList.add("is-talking");
    statusDot.classList.add("is-busy");
    statusText.textContent = "RESPONDENDO";
    definirHudStatus("RESPONDENDO");
  } else {
    statusDot.classList.remove("is-busy");
    statusText.textContent = navigator.onLine ? "ONLINE" : "OFFLINE";
    definirHudStatus("IDLE");
  }
}

function falarBalao(texto) {
  robotSpeech.textContent = texto;
}

function iniciarStatusConexao() {
  atualizarStatusConexao();
  window.addEventListener("online", atualizarStatusConexao);
  window.addEventListener("offline", atualizarStatusConexao);
}

function atualizarStatusConexao() {
  if (aguardandoResposta) return;
  if (navigator.onLine) {
    statusDot.classList.remove("is-offline");
    statusText.textContent = "ONLINE";
  } else {
    statusDot.classList.add("is-offline");
    statusText.textContent = "OFFLINE";
  }
}

// -----------------------------------------------------------------------
// Interação ao clicar no robô + faíscas
// -----------------------------------------------------------------------

robotButton.addEventListener("click", () => {
  resetarTimerSono();
  robotPulse.classList.remove("is-active");
  void robotPulse.offsetWidth;
  robotPulse.classList.add("is-active");

  const frase = FRASES_CUTUCAR[Math.floor(Math.random() * FRASES_CUTUCAR.length)];
  falarBalao(frase);
  dispararFaiscas(4);
});

function dispararFaiscas(quantidade = 7) {
  for (let i = 0; i < quantidade; i++) {
    const spark = document.createElement("span");
    spark.className = "spark";
    const angulo = Math.random() * Math.PI * 2;
    const distancia = 26 + Math.random() * 26;
    spark.style.setProperty("--spark-x", `${Math.cos(angulo) * distancia}px`);
    spark.style.setProperty("--spark-y", `${Math.sin(angulo) * distancia}px`);
    spark.style.left = `${45 + Math.random() * 10}%`;
    spark.style.top = `${40 + Math.random() * 10}%`;
    spark.style.animationDelay = `${Math.random() * 0.15}s`;
    robotSparks.appendChild(spark);
    setTimeout(() => spark.remove(), 950);
  }
}

// olhos acompanham o cursor

const prefereReduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefereReduzirMovimento) {
  dome.classList.add("is-idle-glance");

  document.addEventListener("mousemove", (evento) => {
    const rect = dome.getBoundingClientRect();
    const centroX = rect.left + rect.width / 2;
    const centroY = rect.top + rect.height / 2;
    const deltaX = (evento.clientX - centroX) / window.innerWidth;
    const deltaY = (evento.clientY - centroY) / window.innerHeight;

    dome.style.transform = `translate(${deltaX * 6}px, ${deltaY * 6}px)`;

    const pupilX = Math.max(-3, Math.min(3, deltaX * 14));
    const pupilY = Math.max(-2.5, Math.min(2.5, deltaY * 14));
    const transformPupila = `translate(${pupilX}px, ${pupilY}px)`;
    if (eyeGroupL) eyeGroupL.style.transform = transformPupila;
    if (eyeGroupR) eyeGroupR.style.transform = transformPupila;
  });
}

// -----------------------------------------------------------------------
// Som (bip robótico ao terminar de responder)
// -----------------------------------------------------------------------

let audioCtx = null;

function tocarBip() {
  if (!settings.soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    const tocarTom = (freqInicial, freqFinal, atraso, duracao, volume) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freqInicial, audioCtx.currentTime);
        if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, audioCtx.currentTime + duracao);
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duracao);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duracao + 0.02);
      }, atraso);
    };

    tocarTom(880, 660, 0, 0.16, 0.11);
    tocarTom(1180, null, 110, 0.09, 0.08);
  } catch {
    // Web Audio pode falhar em alguns contextos — segue sem som
  }
}

// -----------------------------------------------------------------------
// Toasts
// -----------------------------------------------------------------------

function mostrarToast(texto) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="toast__dot"></span><span>${texto}</span>`;
  toastStack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("is-leaving");
    setTimeout(() => toast.remove(), 220);
  }, 2600);
}

// -----------------------------------------------------------------------
// Modal de configurações (personalidade, som, memórias)
// -----------------------------------------------------------------------

settingsToggle.addEventListener("click", () => {
  personalityInput.value = settings.personality;
  soundToggle.checked = settings.soundOn;
  atualizarPresetsSelecionados();
  renderizarMemorias();
  settingsBackdrop.hidden = false;
});

settingsClose.addEventListener("click", fecharConfiguracoes);

settingsBackdrop.addEventListener("click", (e) => {
  if (e.target === settingsBackdrop) fecharConfiguracoes();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !settingsBackdrop.hidden) fecharConfiguracoes();
});

function fecharConfiguracoes() {
  settingsBackdrop.hidden = true;
}

presetGrid.addEventListener("click", (e) => {
  const botao = e.target.closest(".preset-btn");
  if (!botao) return;
  personalityInput.value = botao.dataset.preset;
  settings.personality = botao.dataset.preset;
  salvarSettings();
  atualizarPresetsSelecionados();
});

personalityInput.addEventListener("input", () => {
  settings.personality = personalityInput.value;
  salvarSettings();
  atualizarPresetsSelecionados();
});

function atualizarPresetsSelecionados() {
  presetGrid.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("is-selected", btn.dataset.preset === settings.personality);
  });
}

soundToggle.addEventListener("change", () => {
  settings.soundOn = soundToggle.checked;
  salvarSettings();
});

// -----------------------------------------------------------------------
// Campo de partículas (constelação) no fundo da página
// -----------------------------------------------------------------------

(function iniciarParticulas() {
  const canvas = document.getElementById("particleField");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let largura, altura, particulas;
  const CORES = ["43, 217, 197", "155, 123, 255", "100, 120, 235"];
  const QUANTIDADE = window.innerWidth < 700 ? 26 : 46;
  const DISTANCIA_LIGACAO = 130;

  function redimensionar() {
    largura = canvas.width = window.innerWidth;
    altura = canvas.height = window.innerHeight;
  }

  function criarParticulas() {
    particulas = Array.from({ length: QUANTIDADE }, () => ({
      x: Math.random() * largura,
      y: Math.random() * altura,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      cor: CORES[Math.floor(Math.random() * CORES.length)],
      raio: 1 + Math.random() * 1.4,
    }));
  }

  function passo() {
    ctx.clearRect(0, 0, largura, altura);

    for (const p of particulas) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > largura) p.vx *= -1;
      if (p.y < 0 || p.y > altura) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.cor}, 0.6)`;
      ctx.fill();
    }

    for (let i = 0; i < particulas.length; i++) {
      for (let j = i + 1; j < particulas.length; j++) {
        const a = particulas[i];
        const b = particulas[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < DISTANCIA_LIGACAO) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${a.cor}, ${0.12 * (1 - dist / DISTANCIA_LIGACAO)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (!prefereReduzirMovimento) requestAnimationFrame(passo);
  }

  redimensionar();
  criarParticulas();
  window.addEventListener("resize", () => {
    redimensionar();
    criarParticulas();
  });

  if (prefereReduzirMovimento) {
    passo();
  } else {
    requestAnimationFrame(passo);
  }
})();

// -----------------------------------------------------------------------
// Bootstrap inicial
// -----------------------------------------------------------------------

renderizarSidebar();
renderizarConversaAtiva();
atualizarHud();
renderizarMemorias();
atualizarPresetsSelecionados();
iniciarStatusConexao();
resetarTimerSono();
setMood("feliz");
