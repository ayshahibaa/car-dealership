const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const IconHeart = ({ className = 'h-5 w-5', filled = false }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
    <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4.5 5.6 4c2-.3 3.9.6 5 2.2.9.3 2.1 2.2 1.4 1.8 1.1-1.6 3-2.5 5-2.2 3.3.5 5.1 3.8 3.6 7.2-2.5 4.7-10 9.3-10 9.3z" strokeLinejoin="round" />
  </svg>
);

export const IconGauge = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M12 13l3-4" />
    <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" />
    <path d="M4 15a8 8 0 1 1 16 0" />
    <path d="M4 15h1M19 15h1M12 5v1" />
  </svg>
);

export const IconFuel = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M4 20V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14" />
    <path d="M4 11h9" />
    <path d="M13 8.5l3 2.3v6.2a1.5 1.5 0 0 0 3 0v-5c0-1-.4-1.6-1-2.1L16 8" />
    <path d="M2.5 20h12" />
  </svg>
);

export const IconGear = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <circle cx="12" cy="12" r="2.6" />
    <path d="M12 4.5v2M12 17.5v2M19.5 12h-2M6.5 12h-2M17.4 6.6l-1.4 1.4M8 16l-1.4 1.4M17.4 17.4L16 16M8 8 6.6 6.6" />
  </svg>
);

export const IconCalendar = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3v3M16 3v3" />
  </svg>
);

export const IconCheck = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base} strokeWidth={2.4}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IconSearch = ({ className = 'h-5 w-5' }) => (
  <svg className={className} {...base}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4-4" />
  </svg>
);

export const IconChevronRight = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const IconCompare = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </svg>
);

export const IconClose = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base} strokeWidth={2.2}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconCart = ({ className = 'h-4 w-4' }) => (
  <svg className={className} {...base}>
    <path d="M3 4h2l1.2 11.4a1.5 1.5 0 0 0 1.5 1.35h9.1a1.5 1.5 0 0 0 1.47-1.2L20 8H6" />
    <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="17" cy="20" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
