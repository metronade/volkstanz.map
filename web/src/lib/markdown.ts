/**
 * Sehr kleiner Markdown-Subset-Renderer für CMS-Inhalte.
 *
 * Unterstützt: #, ##, ### — Absätze — **fett** — *kursiv* —
 * [text](url) — `- list items` — `> blockquote` — `---` als Trennlinie.
 *
 * Reicht für rechtliche Seiten / Erklärtexte vollkommen aus.
 * Für komplexere Layouts: im Admin-UI HTML erlaubt sind → als Roh-HTML gespeichert.
 *
 * **Sicherheit:** Eingaben kommen aus Directus (authentifiziert). Wir erlauben
 * absichtlich KEIN rohes HTML im Markdown-Input. Wer HTML braucht, verwendet
 * das separate HTML-Feld in Directus und reichert es via Wrapper an.
 */

export function renderMarkdown(md: string): string {
  if (!md) return '';

  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let inList = false;
  let inBlockquote = false;
  let paraBuffer: string[] = [];

  const flushPara = () => {
    if (paraBuffer.length) {
      out.push('<p>' + paraBuffer.join('<br>') + '</p>');
      paraBuffer = [];
    }
  };
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  const closeQuote = () => { if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false; } };

  for (const raw of lines) {
    const line = raw;

    // Heading
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      flushPara(); closeList(); closeQuote();
      const level = h[1].length + 1; // h2-h4 (h1 ist Seitentitel)
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      flushPara(); closeList(); closeQuote();
      out.push('<hr/>');
      continue;
    }

    // List item
    if (/^[-*]\s+/.test(line)) {
      flushPara(); closeQuote();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + inline(line.replace(/^[-*]\s+/, '')) + '</li>');
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      flushPara(); closeList();
      if (!inBlockquote) { out.push('<blockquote>'); inBlockquote = true; }
      out.push('<p>' + inline(line.replace(/^>\s?/, '')) + '</p>');
      continue;
    }

    // Empty line → flush
    if (line.trim() === '') {
      flushPara(); closeList(); closeQuote();
      continue;
    }

    // Regular paragraph line
    closeList(); closeQuote();
    paraBuffer.push(inline(line));
  }

  flushPara(); closeList(); closeQuote();
  return out.join('\n');
}

function inline(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // fett
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // kursiv
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    // links [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // code `…`
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
