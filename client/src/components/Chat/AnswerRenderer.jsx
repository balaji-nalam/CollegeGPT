import { useState } from 'react';
import { ChevronDown, Code2 } from 'lucide-react';

function isMarkdownHeading(line) {
  return /^#{1,6}\s+/.test(line.trim());
}

function isListItem(line) {
  return /^[-*]\s+|^\d+\.\s+/.test(line.trim());
}

function isLikelyCodeLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return true;

  const patterns = [
    /^import\s+\S+/,
    /^from\s+\S+\s+import\s+/,
    /^def\s+\w+\s*\(/,
    /^class\s+\w+\s*\(/,
    /^for\s+\w+\s+in\s+.+:/,
    /^if\s+.+:/,
    /^elif\s+.+:/,
    /^else\s*:/,
    /^while\s+.+:/,
    /^try\s*:/,
    /^except\s+.+:/,
    /^finally\s*:/,
    /^with\s+.+:/,
    /^return\s+.+/,
    /^print\s*\(/,
    /^pass\s*;?$/,
    /^[A-Za-z_]\w*\s*(?:=|\+=|-=|\*=|\/=)\s*.+/,
    /^(?:np|pd|plt|sns|sklearn|model)\./,
    /^\w+\s*\.\w+\s*\(/,
  ];

  return patterns.some((pattern) => pattern.test(trimmed));
}

function isLikelyPythonSnippetChunk(chunk) {
  const lines = chunk
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return false;

  const codeLike = lines.filter(isLikelyCodeLine).length;
  const importLike = lines.some((line) => /^import\s+|^from\s+\S+\s+import\s+/.test(line));
  const assignmentLike = lines.some((line) => /^[A-Za-z_]\w*\s*(?:=|\+=|-=|\*=|\/=|\/=\/=)\s*.+/.test(line));

  return codeLike >= 2 && (importLike || assignmentLike || lines.some((line) => /^(?:def|class|for|if|while|with|try|except|return|print)\b/.test(line)));
}

function deduceLanguage(language) {
  const normalized = (language || '').trim().toLowerCase();
  if (!normalized) return 'python';
  if (['python', 'py', 'py3'].includes(normalized)) return 'python';
  if (['javascript', 'js', 'jsx', 'ts', 'tsx'].includes(normalized)) return 'javascript';
  if (['sql', 'postgresql', 'postgres'].includes(normalized)) return 'sql';
  return normalized;
}

function parseInlineMarkdown(text) {
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\b_\b)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push({ type: 'code', value: token.slice(1, -1) });
    } else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      parts.push({ type: 'strong', value: token.slice(2, -2) });
    } else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_') && token.length > 1)) {
      parts.push({ type: 'em', value: token.slice(1, -1) });
    } else {
      parts.push({ type: 'text', value: token });
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

function InlineMarkdown({ text }) {
  return (
    <>
      {parseInlineMarkdown(String(text || '')).map((part, index) => {
        if (part.type === 'strong') {
          return <strong key={index} className="font-semibold text-slate-100">{part.value}</strong>;
        }

        if (part.type === 'em') {
          return <em key={index} className="italic text-slate-200">{part.value}</em>;
        }

        if (part.type === 'code') {
          return (
            <code key={index} className="rounded-md border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 font-mono text-[0.82em] text-indigo-200">
              {part.value}
            </code>
          );
        }

        return <span key={index}>{part.value}</span>;
      })}
    </>
  );
}

function proseToBlocks(value) {
  const chunkGroups = value
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks = [];

  chunkGroups.forEach((chunk) => {
    const lines = chunk.split('\n').map((line) => line.trimEnd());

    if (lines.every((line) => isListItem(line))) {
      const items = lines.map((line) => {
        const text = line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
        return text;
      });

      const ordered = lines.every((line) => /^\d+\.\s+/.test(line.trim()));
      blocks.push({ type: ordered ? 'ordered-list' : 'unordered-list', items });
      return;
    }

    if (lines.length === 1 && isMarkdownHeading(lines[0])) {
      const level = Math.min(lines[0].match(/^#+/)[0].length, 6);
      blocks.push({ type: 'heading', level, value: lines[0].replace(/^#{1,6}\s+/, '') });
      return;
    }

    if (isLikelyPythonSnippetChunk(chunk)) {
      blocks.push({ type: 'code', language: 'python', value: chunk.trim() });
      return;
    }

    blocks.push({ type: 'paragraph', value: chunk });
  });

  return blocks;
}

function renderParagraphBlock(value) {
  return value
    .split(/\n{2,}/)
    .map((paragraph, paragraphIndex) => {
      const lines = paragraph.split('\n').filter(Boolean);
      const content = lines.join(' ');

      return (
        <p key={paragraphIndex} className="mb-4 whitespace-pre-wrap text-[15px] leading-7 text-slate-300 last:mb-0">
          <InlineMarkdown text={content} />
        </p>
      );
    })
    .filter(Boolean);
}

function renderListBlock(type, items) {
  const ListTag = type === 'ordered-list' ? 'ol' : 'ul';
  const className = type === 'ordered-list'
    ? 'mb-4 list-decimal space-y-2 pl-6 marker:text-indigo-300'
    : 'mb-4 list-disc space-y-2 pl-5 marker:text-indigo-300';

  return (
    <ListTag key={type} className={className}>
      {items.map((item, index) => (
        <li key={index} className="leading-7 text-slate-300">
          <InlineMarkdown text={item} />
        </li>
      ))}
    </ListTag>
  );
}

function renderHeadingBlock(level, value) {
  const sizes = {
    1: 'text-xl font-semibold tracking-tight text-slate-100',
    2: 'text-lg font-semibold tracking-tight text-slate-100',
    3: 'text-base font-semibold text-slate-100',
    4: 'text-sm font-semibold uppercase tracking-wide text-indigo-200',
    5: 'text-sm font-semibold text-slate-200',
    6: 'text-xs font-semibold uppercase tracking-[0.12em] text-slate-400',
  };

  const Tag = `h${level}`;

  return (
    <Tag key={`${level}-${value}`} className={`${sizes[level]} mb-3 mt-5 first:mt-0`}>
      <InlineMarkdown text={value} />
    </Tag>
  );
}

function CollapsibleCode({ value, language }) {
  const [open, setOpen] = useState(false);
  const codeLanguage = deduceLanguage(language);

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/80 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <span className="flex items-center gap-2">
          <Code2 className="h-3.5 w-3.5 text-indigo-400" />
          View example code
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="overflow-x-auto border-t border-slate-800 bg-[#020817]">
          <pre className="min-w-full overflow-x-auto p-4 text-xs leading-6 text-indigo-100">
            <code className={`language-${codeLanguage}`} style={{ whiteSpace: 'pre' }}>
              {value}
            </code>
          </pre>
        </div>
      )}
    </div>
  );
}

function splitContent(content) {
  const raw = String(content || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];

  const blocks = [];
  const fencedPattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = fencedPattern.exec(raw)) !== null) {
    const before = raw.slice(lastIndex, match.index).trim();
    if (before) {
      blocks.push(...proseToBlocks(before));
    }

    blocks.push({
      type: 'code',
      language: match[1].trim() || 'python',
      value: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  const remainder = raw.slice(lastIndex).trim();
  if (remainder) {
    blocks.push(...proseToBlocks(remainder));
  }

  return blocks;
}

export default function AnswerRenderer({ content }) {
  const blocks = splitContent(content);

  return (
    <div className="max-w-[800px] text-[15px] leading-7 text-slate-300">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return renderHeadingBlock(block.level, block.value);
        }

        if (block.type === 'unordered-list' || block.type === 'ordered-list') {
          return renderListBlock(block.type, block.items);
        }

        if (block.type === 'code') {
          return <CollapsibleCode key={`${block.type}-${index}`} value={block.value} language={block.language} />;
        }

        return <div key={`${block.type}-${index}`}>{renderParagraphBlock(block.value)}</div>;
      })}
    </div>
  );
}
