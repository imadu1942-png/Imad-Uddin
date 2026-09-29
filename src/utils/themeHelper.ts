import { PublicViewSettings, THEME_PRESETS, PublicThemeId, PublicHeaderStyle } from '../types/database.types';

export interface ThemeStyles {
  entryBgClass: string;
  entryCardBorderClass: string;
  headerContainerClass: string;
  headerStyle: PublicHeaderStyle;
  accentColor: string;
  primaryButtonClass: string;
  badgeClass: string;
  tableHeaderHighlight: string;
}

export function getThemeStyles(settings: PublicViewSettings): ThemeStyles {
  const preset = THEME_PRESETS.find((p) => p.id === settings.themeId) || THEME_PRESETS[0];
  const accentColor = settings.accentColor || preset.defaultAccent;

  let entryBgClass = 'bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950';
  let entryCardBorderClass = 'border-stone-700/60';
  let badgeClass = 'bg-emerald-700/80 text-emerald-100 border-emerald-500/30';
  let primaryButtonClass = 'bg-emerald-600 hover:bg-emerald-500';
  let tableHeaderHighlight = 'bg-emerald-50/20';

  if (settings.themeId === 'modern_green') {
    entryBgClass = 'bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-950';
    entryCardBorderClass = 'border-teal-500/40';
    badgeClass = 'bg-teal-700/80 text-teal-100 border-teal-400/30';
    primaryButtonClass = 'bg-teal-600 hover:bg-teal-500';
    tableHeaderHighlight = 'bg-teal-50/20';
  } else if (settings.themeId === 'elegant') {
    entryBgClass = 'bg-gradient-to-br from-slate-950 via-stone-900 to-teal-950';
    entryCardBorderClass = 'border-slate-700/60';
    badgeClass = 'bg-slate-800 text-teal-200 border-slate-600';
    primaryButtonClass = 'bg-teal-700 hover:bg-teal-600';
    tableHeaderHighlight = 'bg-slate-50/30';
  } else if (settings.themeId === 'minimal') {
    entryBgClass = 'bg-gradient-to-br from-stone-950 via-zinc-900 to-neutral-950';
    entryCardBorderClass = 'border-stone-700/50';
    badgeClass = 'bg-stone-800 text-stone-200 border-stone-600';
    primaryButtonClass = 'bg-stone-800 hover:bg-stone-700';
    tableHeaderHighlight = 'bg-stone-100/50';
  }

  // Determine Header container class based on headerStyle
  let headerContainerClass = `bg-gradient-to-r ${preset.headerBgClass} text-white shadow-sm`;

  if (settings.headerStyle === 'solid') {
    headerContainerClass = 'bg-stone-900 text-white shadow-sm border border-stone-800';
  } else if (settings.headerStyle === 'bordered') {
    headerContainerClass = 'bg-stone-900/95 text-white shadow-md border-2 border-emerald-600/60';
    if (settings.themeId === 'modern_green') {
      headerContainerClass = 'bg-stone-900/95 text-white shadow-md border-2 border-teal-500/60';
    } else if (settings.themeId === 'elegant') {
      headerContainerClass = 'bg-slate-900/95 text-white shadow-md border-2 border-slate-600';
    } else if (settings.themeId === 'minimal') {
      headerContainerClass = 'bg-zinc-900/95 text-white shadow-md border-2 border-stone-600';
    }
  } else if (settings.headerStyle === 'card') {
    headerContainerClass = `bg-gradient-to-r ${preset.headerBgClass} text-white shadow-lg border border-white/10 rounded-3xl`;
  }

  return {
    entryBgClass,
    entryCardBorderClass,
    headerContainerClass,
    headerStyle: settings.headerStyle,
    accentColor,
    primaryButtonClass,
    badgeClass,
    tableHeaderHighlight,
  };
}
