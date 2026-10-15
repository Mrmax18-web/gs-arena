import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { useCreator } from '../../hooks/useCreator';
import { CreatorPasswordModal } from './CreatorPasswordModal';
import { cn } from '../../lib/cn';

export interface CreatorBulbProps {
  className?: string;
}

export function CreatorBulb({ className }: CreatorBulbProps) {
  const navigate = useNavigate();
  const { isCreatorUnlocked } = useCreator();
  const [modalOpen, setModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCreatorUnlocked) {
      navigate('/creator');
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Restricted Access"
        onClick={handleClick}
        className={cn(
          'transition-all duration-300 cursor-pointer p-1.5 rounded-full select-none z-30',
          'text-white/25 hover:text-[#FFD166] hover:scale-115 hover:drop-shadow-[0_0_10px_#FFD166]',
          'focus:outline-none',
          className
        )}
      >
        <Lightbulb className="w-4 h-4 transition-transform duration-300" />
      </button>

      <CreatorPasswordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export const CreatorDot = CreatorBulb;
