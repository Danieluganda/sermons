import React from 'react';

type CardTheme = 'gold' | 'olive' | 'night';

interface ShareableCardProps {
  title: string;
  scripture?: string;
  content: string;
  tags?: string[];
  theme?: CardTheme;
}

const themeMap: Record<CardTheme, string> = {
  gold: 'from-amber-100 via-orange-50 to-stone-100 text-stone-900',
  olive: 'from-lime-100 via-emerald-50 to-stone-100 text-stone-900',
  night: 'from-stone-900 via-stone-800 to-stone-700 text-white'
};

export default function ShareableCard({
  title,
  scripture,
  content,
  tags = [],
  theme = 'gold'
}: ShareableCardProps) {
  return (
    <div className={`w-[1080px] min-h-[1350px] bg-gradient-to-br ${themeMap[theme]} p-16 rounded-[48px] shadow-2xl flex flex-col justify-between`}>
      <div className="space-y-8">
        <div className="text-xs uppercase tracking-[0.4em] font-bold opacity-70">
          Sermo Jo
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl leading-tight font-bold">{title || 'Sermon Note'}</h1>
          {scripture ? (
            <p className="text-3xl font-medium opacity-80">{scripture}</p>
          ) : null}
        </div>

        <div className="bg-white/50 rounded-[32px] p-10">
          <p className="text-3xl leading-relaxed whitespace-pre-wrap">
            {content || 'No content provided.'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {tags.length ? (
          <div className="flex flex-wrap gap-3">
            {tags.map(tag => (
              <span
                key={tag}
                className="px-5 py-2 rounded-full bg-black/10 text-xl font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="text-xl opacity-70">
          Shared from Sermo Jo
        </div>
      </div>
    </div>
  );
}
