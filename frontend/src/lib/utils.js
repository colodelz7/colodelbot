export const STORAGE_CONVERSAS = 'colodelbot:conversations:v2';
export const STORAGE_SETTINGS = 'colodelbot:settings:v1';
export const STORAGE_MEMORY = 'colodelbot:memory:v1';

export const TAMANHO_MAX_HISTORICO = 12;
export const DIAS_ATE_PURGAR_LIXEIRA = 7;
export const MS_ATE_DORMIR = 90 * 1000;
export const LARGURA_MAX_IMAGEM = 640;

export const MENSAGEM_BOAS_VINDAS = 'Oi! Eu sou o ColodelBot 👋 Pode me perguntar qualquer coisa.';

export const FRASES_CUTUCAR = [
  'Oi de novo! 👀',
  'Pode perguntar, eu tô aqui.',
  'Bipe bop. Tudo certo por aqui.',
  'Bora trocar uma ideia?',
  'Manda a pergunta!',
];

export const FRASES_RATE_LIMIT = [
  'Calma aí! Espera um pouquinho 😤',
  'Devagar! Deixa eu respirar.',
  'Muitas mensagens de uma vez, hein?',
];

export function gerarId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function novaConversa() {
  const agora = Date.now();
  return {
    id: gerarId(),
    title: 'Nova conversa',
    titleAuto: true,
    createdAt: agora,
    updatedAt: agora,
    pinned: false,
    deletedAt: null,
    messages: [{ role: 'bot', text: MENSAGEM_BOAS_VINDAS, time: agora }],
  };
}

export function resumir(texto, limite = 90) {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  return limpo.length > limite ? limpo.slice(0, limite).trim() + '…' : limpo;
}

export function tempoRelativo(timestamp) {
  if (!timestamp) return '';
  const diffMin = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatarHora(timestamp) {
  return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function redimensionarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('falha ao ler arquivo'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('falha ao carregar imagem'));
      img.onload = () => {
        const escala = Math.min(1, LARGURA_MAX_IMAGEM / img.width);
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, largura, altura);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        const base64 = dataUrl.split(',')[1];
        resolve({ dataUrl, base64, mimeType: 'image/jpeg' });
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}
