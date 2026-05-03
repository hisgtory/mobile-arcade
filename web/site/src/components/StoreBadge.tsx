interface Props {
  store: 'app-store' | 'play-store';
  url?: string;
}

const LABELS = {
  'app-store': { line1: 'Download on the', line2: 'App Store', emoji: '' },
  'play-store': { line1: 'GET IT ON', line2: 'Google Play', emoji: '▶' },
} as const;

export function StoreBadge({ store, url }: Props) {
  const { line1, line2 } = LABELS[store];
  const inner = (
    <span className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-white shadow-soft transition-transform hover:-translate-y-0.5">
      <span className="text-2xl" aria-hidden>
        {store === 'app-store' ? '' : '▶'}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wide opacity-80">
          {line1}
        </span>
        <span className="font-display text-lg">{line2}</span>
      </span>
    </span>
  );

  if (!url) {
    return (
      <span className="cursor-not-allowed opacity-50" aria-disabled>
        {inner}
      </span>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}
