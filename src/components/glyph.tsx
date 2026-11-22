const paths = {
  arrow: 'M4 12h15m-6-6 6 6-6 6', external: 'M6 18 18 6M6 6h12v12',
  search: 'M20 20l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z', bookmark: 'M6 4h12v16l-6-4-6 4V4Z',
  copy: 'M8 8h12v12H8zM16 8V4H4v12h4', check: 'M4 12l5 5L20 6', close: 'M6 6l12 12M18 6 6 18',
  play: 'm8 5 11 7-11 7V5Z', terminal: 'm3 6 6 6-6 6m9 0h8', download: 'M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4',
  shield: 'm12 3 8 3v5c0 5-4 8-8 10-4-2-8-5-8-10V6l8-3Zm-4 9 3 3 5-6',
  layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5',
  reset: 'M4 10a8 8 0 1 1 1 7M4 4v6h6', menu: 'M4 7h16M4 12h16M4 17h16',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  key: 'M14 3a6 6 0 1 1-3 11L5 20H2v-3l7-7a6 6 0 0 1 5-7Zm1 4h.01',
  pulse: 'M2 12h5l3-8 4 16 3-8h5', clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-5v5l3 2',
};

export function Glyph({ name, size = 16, className = '' }: { name: keyof typeof paths; size?: number; className?: string }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}><path d={paths[name]} /></svg>;
}
