import { marked } from 'marked';
import DOMPurify from 'dompurify';

const rendererMarkdown = new marked.Renderer();
rendererMarkdown.code = (code, lang) => {
  const texto = typeof code === 'string' ? code : code.text || '';
  const escapado = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rotulo = (lang || (code && code.lang) || 'código').toString().slice(0, 20);
  return `<div class="code-block"><div class="code-block__head"><span>${rotulo}</span><button type="button" class="code-block__copy">Copiar</button></div><pre><code>${escapado}</code></pre></div>`;
};
marked.use({ renderer: rendererMarkdown, breaks: true });

export function renderMarkdown(texto) {
  try {
    const html = marked.parse(texto);
    return DOMPurify.sanitize(html);
  } catch {
    return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
