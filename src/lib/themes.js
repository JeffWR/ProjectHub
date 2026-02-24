// ─── THEME DEFINITIONS ───────────────────────────────────────────────────────
// Each key is a CSS custom property set on <html> at runtime.
// To add a new theme: add an entry here — nothing else needs to change.

export const themes = {
    pomodoro: {
        '--bg-gradient':    'linear-gradient(135deg, #ba4949 0%, #d65a5a 100%)',
        '--color-primary':  '#ba4949',
        '--color-primary-2':'#d65a5a',
        '--text-primary':   '#ffffff',
        '--text-secondary': 'rgba(255,255,255,0.7)',
        '--text-muted':     'rgba(255,255,255,0.5)',
        '--text-faint':     'rgba(255,255,255,0.4)',
        '--surface':        'rgba(255,255,255,0.1)',
        '--surface-hover':  'rgba(255,255,255,0.15)',
        '--surface-modal':  'rgba(30,30,30,0.95)',
        '--border':         'rgba(255,255,255,0.1)',
        '--border-strong':  'rgba(255,255,255,0.2)',
        '--input-bg':       'rgba(0,0,0,0.2)',
        '--shadow':         'none',
    },
    dark: {
        '--bg-gradient':    'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
        '--color-primary':  '#7c6cfc',
        '--color-primary-2':'#9d8fff',
        '--text-primary':   '#ffffff',
        '--text-secondary': 'rgba(255,255,255,0.7)',
        '--text-muted':     'rgba(255,255,255,0.5)',
        '--text-faint':     'rgba(255,255,255,0.35)',
        '--surface':        'rgba(255,255,255,0.07)',
        '--surface-hover':  'rgba(255,255,255,0.12)',
        '--surface-modal':  'rgba(15,15,25,0.97)',
        '--border':         'rgba(255,255,255,0.08)',
        '--border-strong':  'rgba(255,255,255,0.15)',
        '--input-bg':       'rgba(0,0,0,0.3)',
        '--shadow':         'none',
    },
    light: {
        '--bg-gradient':    'linear-gradient(135deg, #f0f4f8 0%, #dce8f5 100%)',
        '--color-primary':  '#ba4949',
        '--color-primary-2':'#d65a5a',
        '--text-primary':   '#1a1a2e',
        '--text-secondary': 'rgba(26,26,46,0.7)',
        '--text-muted':     'rgba(26,26,46,0.5)',
        '--text-faint':     'rgba(26,26,46,0.4)',
        '--surface':        'rgba(255,255,255,0.82)',
        '--surface-hover':  'rgba(255,255,255,0.95)',
        '--surface-modal':  'rgba(255,255,255,0.97)',
        '--border':         'rgba(0,0,0,0.07)',
        '--border-strong':  'rgba(0,0,0,0.13)',
        '--input-bg':       'rgba(0,0,0,0.04)',
        '--shadow':         '0 4px 24px rgba(0,0,0,0.07)',
    },
};

export const themeLabels = {
    pomodoro: 'Pomodoro',
    dark:     'Dark',
    light:    'Light',
};
