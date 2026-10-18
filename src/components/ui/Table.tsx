import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  highlightRow?: (item: T) => boolean;
  mobileCardRender?: (item: T, index: number) => React.ReactNode;
  emptyText?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  highlightRow,
  mobileCardRender,
  emptyText = 'No records found.',
}: TableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card Layout (visible on small screens when mobileCardRender is provided) */}
      {mobileCardRender && (
        <div className="md:hidden space-y-3">
          {data.map((item, index) => (
            <div
              key={keyExtractor(item, index)}
              onClick={() => onRowClick && onRowClick(item)}
              className={`rounded-2xl p-4 glass border transition-all ${
                highlightRow && highlightRow(item)
                  ? 'border-brand-500/50 bg-brand-500/10 dark:bg-brand-500/10'
                  : 'border-black/5 dark:border-white/10'
              } ${onRowClick ? 'cursor-pointer hover:border-brand-500/30' : ''}`}
            >
              {mobileCardRender(item, index)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop & Tablet Table (or fallback if no mobileCardRender) */}
      <div
        className={`overflow-x-auto rounded-2xl glass border border-slate-200 dark:border-white/10 shadow-sm ${
          mobileCardRender ? 'hidden md:block' : 'block'
        }`}
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {data.map((item, index) => {
              const isHighlighted = highlightRow ? highlightRow(item) : false;
              return (
                <tr
                  key={keyExtractor(item, index)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`transition-colors duration-150 ${
                    isHighlighted
                      ? 'bg-brand-500/10 dark:bg-brand-500/15 font-semibold text-slate-900 dark:text-white'
                      : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-xs ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render
                        ? col.render(item, index)
                        : (item as any)[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
