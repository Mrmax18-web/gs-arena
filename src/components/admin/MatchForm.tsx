import React, { useState } from 'react';
import { Match, MatchStatus } from '../../types/tournament';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Stepper, StepItem } from '../ui/Stepper';
import { InlineNotice } from '../ui/InlineNotice';
import { useToast } from '../ui/Toast';
import { createMatch, updateMatch } from '../../services/tournamentService';
import { MatchFormSchema } from '../../lib/validators';
import { Icon } from '@iconify/react';

interface MatchFormProps {
  tournamentId: string;
  match?: Match | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const MATCH_STEPS: StepItem[] = [
  { id: 'schedule', title: 'Schedule', description: 'Number & Kickoff' },
  { id: 'battleground', title: 'Map', description: 'Terrain & Presets' },
  { id: 'review', title: 'Status', description: 'State & Publish' },
];

/**
 * MatchForm implements the cognitive Law of Uniform Connectedness using Stepper.
 *
 * Divides match configuration into three progressive phases:
 * 1. Schedule: Sequential match index & kickoff time
 * 2. Map: Terrain identification & quick presets
 * 3. Status: Operational phase & final validation
 */
export const MatchForm: React.FC<MatchFormProps> = ({
  tournamentId,
  match,
  onSuccess,
  onCancel,
}) => {
  const { success, error } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState(match ? 2 : 0);

  const [matchNumber, setMatchNumber] = useState<number>(match?.matchNumber ?? 1);
  const [scheduledAt, setScheduledAt] = useState<string>(
    match?.scheduledAt || new Date().toISOString().slice(0, 16)
  );
  const [map, setMap] = useState<string>(match?.map || 'Erangel');
  const [status, setStatus] = useState<MatchStatus>(match?.status || 'scheduled');
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const mapPresets = [
    'Erangel',
    'Miramar',
    'Sanhok',
    'Vikendi',
    'Bermuda',
    'Purgatory',
    'Kalahari',
    'Alpine',
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled (Upcoming)' },
    { value: 'live', label: 'Live (Lobby Active)' },
    { value: 'completed', label: 'Completed (Results In)' },
  ];

  const handleNextSchedule = () => {
    setStepError(null);
    if (!matchNumber || matchNumber < 1) {
      setStepError('Match number must be greater than or equal to 1.');
      return;
    }
    if (!scheduledAt) {
      setStepError('Please set scheduled kickoff date and time.');
      return;
    }
    setCurrentStep(1);
    setMaxAccessibleStep((m) => Math.max(m, 1));
  };

  const handleNextMap = () => {
    setStepError(null);
    if (!map.trim()) {
      setStepError('Please enter or select a battleground map.');
      return;
    }
    setCurrentStep(2);
    setMaxAccessibleStep((m) => Math.max(m, 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    const val = MatchFormSchema.safeParse({
      matchNumber: Number(matchNumber),
      scheduledAt,
      map: map.trim(),
      status,
    });

    if (!val.success) {
      const msg = val.error.errors[0]?.message || 'Please fix form fields';
      setStepError(msg);
      error('Validation Error', msg);
      return;
    }

    setSubmitting(true);
    try {
      if (match?.id) {
        await updateMatch(tournamentId, match.id, {
          matchNumber: val.data.matchNumber,
          scheduledAt: val.data.scheduledAt,
          map: val.data.map,
          status: val.data.status,
        });
        success('Match Updated', `Match #${val.data.matchNumber} has been updated.`);
      } else {
        await createMatch(tournamentId, {
          matchNumber: val.data.matchNumber,
          scheduledAt: val.data.scheduledAt,
          map: val.data.map,
          status: val.data.status,
        });
        success('Match Created', `Match #${val.data.matchNumber} has been scheduled.`);
      }
      onSuccess();
    } catch (err: any) {
      const msg = err?.message || 'Could not save match.';
      setStepError(msg);
      error('Save Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard strong className="p-6 text-left">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {match ? `Edit Match #${match.matchNumber}` : 'Create New Match'}
        </h4>
        <span className="text-xs font-mono text-slate-400">Step {currentStep + 1} of 3</span>
      </div>

      {/* Stepper Navigation */}
      <div className="mb-5">
        <Stepper
          steps={MATCH_STEPS}
          currentStep={currentStep}
          maxAccessibleStep={maxAccessibleStep}
          onStepClick={(idx) => setCurrentStep(idx)}
          ariaLabel="Match creation process"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Schedule */}
        {currentStep === 0 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Input
              label="Match Sequential Number"
              type="number"
              min={1}
              value={matchNumber}
              onChange={(e) => setMatchNumber(Number(e.target.value))}
              required
              helperText="E.g. 1 for Match 1, 2 for Match 2"
            />

            <Input
              label={`Scheduled Kickoff Time (${userTimezone})`}
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              helperText={`Timezone: ${userTimezone}`}
              required
            />

            {stepError && <InlineNotice variant="error">{stepError}</InlineNotice>}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNextSchedule}
                icon="solar:arrow-right-bold"
              >
                Next: Map Selection
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Map Selection */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <Input
                label="Battleground Map"
                placeholder="e.g. Erangel"
                value={map}
                onChange={(e) => setMap(e.target.value)}
                required
              />
              <div className="mt-2 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {mapPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMap(preset)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                        map === preset
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                          : 'border-slate-200 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:border-amber-500/50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {stepError && <InlineNotice variant="error">{stepError}</InlineNotice>}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(0)}
                icon="solar:arrow-left-bold"
              >
                Back to Schedule
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleNextMap}
                icon="solar:arrow-right-bold"
              >
                Next: Status & Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Status & Review */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Select
              label="Match Operational Status"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value as MatchStatus)}
            />

            {/* Match Summary Review Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-black/10 space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Icon icon="solar:notes-bold" /> Summary Review
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[10px]">Match:</span>
                  <span className="font-bold">Match #{matchNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Map:</span>
                  <span className="font-bold">{map}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Kickoff:</span>
                  <span className="font-mono">{scheduledAt.replace('T', ' ')}</span>
                </div>
              </div>
            </div>

            {stepError && <InlineNotice variant="error">{stepError}</InlineNotice>}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(1)}
                icon="solar:arrow-left-bold"
              >
                Back to Map
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submitting}>
                {match ? 'Update Match' : 'Publish Match'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </GlassCard>
  );
};
