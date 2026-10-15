import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { Card } from './ui/Card';

export interface ContactCardProps {
  icon: React.ReactNode | string;
  label: string;
  value: string;
  href?: string;
  action?: string;
  external?: boolean;
  copyable?: boolean;
}

export function ContactCard({
  icon,
  label,
  value,
  href,
  action,
  external = false,
  copyable = true,
}: ContactCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-4 sm:p-5 border border-white/10 hover:border-orange-500/30 transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl shrink-0 text-orange-400">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 block mb-0.5">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-semibold text-white truncate break-all">
                {value}
              </span>
              {copyable && (
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {href && (
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="px-3.5 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-amber-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-orange-500/20"
            >
              <span>{action || 'Open'}</span>
              {external ? <ExternalLink className="w-3 h-3" /> : null}
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
