'use client';

import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  image_url?: string;
  source?: string;
  published_at?: string;
  author?: string;
}

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card group hover:shadow-md transition-shadow flex flex-col"
    >
      {article.image_url && (
        <div className="h-40 overflow-hidden">
          <img
            src={article.image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-lg text-forest-800 mb-2 group-hover:text-forest-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="font-body text-forest-500 text-sm leading-relaxed mb-3 line-clamp-2 flex-1">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-forest-400 text-xs font-sans">
            {article.source}
            {article.published_at && ` · ${format(new Date(article.published_at), 'MMM d')}`}
          </span>
          <ExternalLink size={12} className="text-gold-500" />
        </div>
      </div>
    </a>
  );
}
