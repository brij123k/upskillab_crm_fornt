import { useRef } from 'react';
import { Bold, Italic, List, Quote } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormattedText } from './FormattedText';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  previewLabel?: string;
};

export function FormattedTextEditor({ value, onChange, placeholder, previewLabel = 'Preview' }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const insertWrap = (before: string, after = before) => {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || 'text';
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursorStart = start + before.length;
      const cursorEnd = cursorStart + selected.length;
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const insertPrefix = (prefix: string) => {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || 'item';
    const next = `${value.slice(0, start)}${prefix}${selected}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => insertWrap('**')}>
          <Bold className="mr-2 h-4 w-4" />
          Bold
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insertWrap('*')}>
          <Italic className="mr-2 h-4 w-4" />
          Italic
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insertPrefix('- ')}>
          <List className="mr-2 h-4 w-4" />
          Bullet
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => insertPrefix('> ')}>
          <Quote className="mr-2 h-4 w-4" />
          Quote
        </Button>
      </div>

      <Textarea
        ref={ref}
        placeholder={placeholder}
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <Card className="border-dashed">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">{previewLabel}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {value.trim() ? (
            <FormattedText text={value} className="text-sm text-foreground" />
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
