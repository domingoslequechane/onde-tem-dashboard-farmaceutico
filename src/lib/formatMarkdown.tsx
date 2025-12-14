import React from 'react';

// Format inline markdown (bold, italic, code, links)
export const formatInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code key={keyCounter++} className="bg-background/60 border border-border/50 px-1.5 py-0.5 rounded text-xs font-mono text-primary">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(<strong key={keyCounter++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(<em key={keyCounter++} className="italic">{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Links
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a key={keyCounter++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" 
           className="text-primary underline hover:text-primary/80 transition-colors">
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular character
    const nextSpecial = remaining.search(/[`*\[]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
};

// Format full markdown content to HTML elements
export const formatMarkdownToHtml = (content: string): React.ReactNode => {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;
  let codeContent = '';

  lines.forEach((line, index) => {
    // Skip horizontal rules
    if (/^[-*_]{3,}$/.test(line.trim())) {
      return;
    }

    // Code block start/end
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeContent = '';
      } else {
        elements.push(
          <pre key={`code-${index}`} className="bg-background/60 border border-border/50 rounded-lg p-3 my-2 overflow-x-auto">
            <code className="text-sm font-mono">{codeContent.trim()}</code>
          </pre>
        );
        inCodeBlock = false;
      }
      return;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="text-lg font-bold mb-2 mt-3 first:mt-0">
          {formatInlineMarkdown(line.slice(2))}
        </h1>
      );
      return;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="text-base font-semibold mb-2 mt-3">
          {formatInlineMarkdown(line.slice(3))}
        </h2>
      );
      return;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="text-sm font-semibold mb-1 mt-2">
          {formatInlineMarkdown(line.slice(4))}
        </h3>
      );
      return;
    }

    // Bullet points (- or * or •)
    if (/^[-*•]\s/.test(line)) {
      elements.push(
        <div key={index} className="flex items-start gap-2.5 my-1 pl-1">
          <span className="text-primary font-bold text-sm mt-0.5 select-none">•</span>
          <span className="flex-1">{formatInlineMarkdown(line.slice(2))}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={index} className="flex items-start gap-2.5 my-1 pl-1">
          <span className="text-primary font-semibold text-sm min-w-[1.25rem]">{numberedMatch[1]}.</span>
          <span className="flex-1">{formatInlineMarkdown(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    // Regular text
    elements.push(
      <p key={index} className="my-1 leading-relaxed">{formatInlineMarkdown(line)}</p>
    );
  });

  return <>{elements}</>;
};
