import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

export const SectionSkeleton = ({ label }) => (
     <section className="card-surface p-5" aria-busy="true" aria-label={`${label} 불러오는 중`}>
          <div className="mb-4 h-5 w-32 animate-pulse rounded-lg bg-slate-200" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
               {[0, 1, 2].map((item) => (
                    <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
               ))}
          </div>
     </section>
);

export const FeedError = ({ title, onRetry, description }) => (
     <section className="card-surface flex flex-col items-center px-5 py-10 text-center" role="status">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-brand-accent">
               <RefreshCw className="h-5 w-5" />
          </div>
          <h2 className="text-base font-black text-brand-ink">{title}을 불러오지 못했어요</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
               {description || '잠시 후 다시 시도하거나 다른 메뉴를 먼저 둘러보세요.'}
          </p>
          {onRetry && (
               <button type="button" onClick={onRetry} className="btn-brand mt-4 px-4 py-2 text-sm">
                    다시 시도
               </button>
          )}
     </section>
);

export const EmptyFeedCTA = ({
     title,
     description,
     actionLabel,
     onAction,
     rewardText,
     icon: Icon = Plus,
}) => (
     <div className="rounded-2xl border border-dashed border-brand-gold/25 bg-gradient-to-br from-brand-light/60 via-white to-white px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-soft">
               <Icon className="h-7 w-7 text-brand-accent" />
          </div>
          <p className="text-base font-black text-brand-ink">{title}</p>
          <p className="mt-2 text-sm font-semibold text-slate-500">{description}</p>
          {rewardText && (
               <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800">
                    {rewardText}
               </p>
          )}
          {onAction && actionLabel && (
               <button type="button" onClick={onAction} className="btn-brand mt-5 inline-flex items-center gap-2 px-5 py-3 text-sm">
                    <Icon className="h-4 w-4" />
                    {actionLabel}
               </button>
          )}
     </div>
);
