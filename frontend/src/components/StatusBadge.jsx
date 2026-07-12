import React from 'react';

// Every status string used across Vehicle / Driver / Trip / Maintenance maps to
// one signal color, kept consistent everywhere it appears (badges, manifest rails, KPI dots).
const MAP = {
  Available: 'go',
  Open: 'transit',
  Dispatched: 'transit',
  'On Trip': 'hold',
  Draft: 'idle',
  'Off Duty': 'idle',
  'In Shop': 'transit',
  Completed: 'go',
  Closed: 'idle',
  Retired: 'stop',
  Suspended: 'stop',
  Cancelled: 'stop',
};

const DOT = {
  go: 'bg-signal-go',
  hold: 'bg-signal-hold',
  stop: 'bg-signal-stop',
  idle: 'bg-signal-idle',
  transit: 'bg-signal-transit',
};

const TEXT = {
  go: 'text-signal-go',
  hold: 'text-[#8A6100]',
  stop: 'text-signal-stop',
  idle: 'text-muted',
  transit: 'text-signal-transit',
};

const BG = {
  go: 'bg-[#EAF6F2]',
  hold: 'bg-[#FEF6E2]',
  stop: 'bg-[#FBEBEB]',
  idle: 'bg-[#F0F0EE]',
  transit: 'bg-[#EAF0FC]',
};

export function statusTone(status) {
  return MAP[status] || 'idle';
}

export default function StatusBadge({ status, className = '' }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${BG[tone]} ${TEXT[tone]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      {status}
    </span>
  );
}
