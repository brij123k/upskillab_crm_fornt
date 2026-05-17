import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FormattedTextProps = {
  text: string;
  className?: string;
};

const renderInline = (input: string) => {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;

  input.replace(pattern, (match, _group, offset) => {
    if (offset > lastIndex) {
      parts.push(input.slice(lastIndex, offset));
    }

    const isBold = match.startsWith('**') && match.endsWith('**');
    const isItalic = match.startsWith('*') && match.endsWith('*') && !isBold;
    const content = match.replace(/^\*\*?|\*\*?$/g, '');

    if (isBold) {
      parts.push(<strong key={`${offset}-bold`}>{content}</strong>);
    } else if (isItalic) {
      parts.push(<em key={`${offset}-italic`}>{content}</em>);
    } else {
      parts.push(match);
    }

    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < input.length) {
    parts.push(input.slice(lastIndex));
  }

  return parts;
};

export function FormattedText({ text, className }: FormattedTextProps) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: number) => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${key}`} className="list-disc space-y-1 pl-5">
        {listItems.map((item, idx) => (
          <li key={`${key}-${idx}`}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(index);
      blocks.push(<div key={`space-${index}`} className="h-3" />);
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList(index);

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={index} className="text-base font-semibold">
          {renderInline(trimmed.slice(4))}
        </h4>,
      );
      return;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={index} className="text-lg font-semibold">
          {renderInline(trimmed.slice(3))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={index} className="text-xl font-semibold">
          {renderInline(trimmed.slice(2))}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={index}
          className="border-l-4 border-primary/40 bg-muted/40 px-4 py-2 italic text-muted-foreground"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>,
      );
      return;
    }

    blocks.push(
      <p key={index} className="whitespace-pre-wrap leading-7">
        {renderInline(line)}
      </p>,
    );
  });

  flushList(lines.length);

  return <div className={cn('space-y-3', className)}>{blocks}</div>;
}
