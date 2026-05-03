import Link from 'next/link';
import type { AppMeta } from '@/data/apps';

interface Props {
  app: AppMeta;
}

export function AppIcon({ app }: Props) {
  if (app.comingSoon) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-50">
        <div
          aria-hidden
          className="size-20 rounded-3xl border-2 border-dashed border-slate-300 bg-white/40 sm:size-24"
        />
        <span className="text-xs font-semibold text-slate-500 sm:text-sm">
          Coming Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={`/${app.slug}`}
      className="group flex flex-col items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-cherry rounded-3xl"
    >
      <div
        className="flex size-20 items-center justify-center rounded-3xl text-4xl shadow-pop transition-transform duration-200 group-hover:scale-105 group-active:scale-95 sm:size-24 sm:text-5xl"
        style={{ background: app.iconBg }}
        aria-hidden
      >
        {app.iconEmoji}
      </div>
      <span className="text-xs font-bold text-slate-700 sm:text-sm">
        {app.title}
      </span>
    </Link>
  );
}

export function ComingSoonIcon() {
  return (
    <div className="flex flex-col items-center gap-2 opacity-40">
      <div
        aria-hidden
        className="size-20 rounded-3xl border-2 border-dashed border-slate-300 bg-white/40 sm:size-24"
      />
      <span className="text-xs font-semibold text-slate-400 sm:text-sm">
        Coming Soon
      </span>
    </div>
  );
}
