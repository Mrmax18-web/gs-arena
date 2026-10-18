import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGame, isValidGameId } from '../context/GameContext';
import { GAME_STORAGE_KEY } from '../lib/constants';

describe('GameContext and Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates canonical game IDs correctly', () => {
    expect(isValidGameId('BGMI')).toBe(true);
    expect(isValidGameId('FF_BR')).toBe(true);
    expect(isValidGameId('FF_CS')).toBe(true);
    expect(isValidGameId('PUBG_MOBILE')).toBe(false);
    expect(isValidGameId('MALICIOUS_INPUT')).toBe(false);
    expect(isValidGameId(null)).toBe(false);
    expect(isValidGameId(undefined)).toBe(false);
  });

  it('defaults to BGMI if localStorage contains an invalid game ID', () => {
    localStorage.setItem(GAME_STORAGE_KEY, 'INVALID_GAME_HACK');

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <GameProvider>{children}</GameProvider>
    );

    const { result } = renderHook(() => useGame(), { wrapper });
    expect(result.current.gameId).toBe('BGMI');
    expect(result.current.game.name).toBe('Battlegrounds Mobile India');
  });

  it('restores valid game selection from localStorage', () => {
    localStorage.setItem(GAME_STORAGE_KEY, 'FF_CS');

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <GameProvider>{children}</GameProvider>
    );

    const { result } = renderHook(() => useGame(), { wrapper });
    expect(result.current.gameId).toBe('FF_CS');
    expect(result.current.game.mode).toBe('Clash Squad');
  });

  it('persists updated game selection to localStorage', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <GameProvider>{children}</GameProvider>
    );

    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.setGameId('FF_BR');
    });

    expect(result.current.gameId).toBe('FF_BR');
    expect(localStorage.getItem(GAME_STORAGE_KEY)).toBe('FF_BR');
  });
});
