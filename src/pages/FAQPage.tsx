import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestoreDoc } from '../hooks/useFirestoreDoc';
import { systemConfigConverter } from '../lib/converters';
import { SystemConfig } from '../types/config';
import { DEFAULT_SYSTEM_CONFIG } from '../lib/constants';
import { GlassCard } from '../components/ui/GlassCard';
import { Icon } from '@iconify/react';

export const FAQPage: React.FC = () => {
  const { data: config } = useFirestoreDoc<SystemConfig>('config/system', systemConfigConverter);

  const faqItems = config?.faqItems?.length ? config.faqItems : DEFAULT_SYSTEM_CONFIG.faqItems;
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ 'faq-1': true });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 text-left">
      <div className="text-center space-y-2 border-b border-slate-200 dark:border-white/10 pb-4">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Common inquiries regarding registrations, match credentials dispatch, scoring metrics, and technical requirements.
        </p>
      </div>

      <div className="space-y-3">
        {faqItems.map((item) => {
          const isOpen = Boolean(openIds[item.id]);

          return (
            <GlassCard key={item.id} className="p-0 overflow-hidden transition-all duration-200">
              <button
                type="button"
                onClick={() => toggleItem(item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-900 dark:text-white hover:text-brand-500 dark:hover:text-brand-400 transition-colors focus-visible:outline-none"
              >
                <span>{item.question}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-400 text-lg shrink-0 ml-4"
                >
                  <Icon icon="solar:alt-arrow-down-bold" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-black/5 dark:border-white/5">
                      {/* Text only, never unsanitized HTML */}
                      <p>{item.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
