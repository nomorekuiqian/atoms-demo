/** Theme presets a maker can pick before building. Sent to the team as a plain-language constraint. */
export type ThemePreset = { id: string; name: string; swatch: [string, string, string]; brief: string; preview:{font:string;radius:number} };

export const THEMES: ThemePreset[] = [
  {
    id: "paper",
    preview:{font:"Georgia, serif",radius:2},
    name: "Paper",
    swatch: ["#fbfaf7", "#1c1b19", "#d9480f"],
    brief: "warm off-white background (#fbfaf7), near-black text (#1c1b19), one burnt-orange accent (#d9480f), a serif for headings, generous whitespace, hairline borders",
  },
  {
    id: "midnight",
    preview:{font:"Arial, sans-serif",radius:12},
    name: "Midnight",
    swatch: ["#0f1115", "#e8eaf0", "#7c9cff"],
    brief: "dark background (#0f1115), light text (#e8eaf0), periwinkle accent (#7c9cff), soft-glow focus states, rounded 12px corners, a clean geometric sans",
  },
  {
    id: "garden",
    preview:{font:"Verdana, sans-serif",radius:22},
    name: "Garden",
    swatch: ["#f3f7f2", "#1f3324", "#3f8f5a"],
    brief: "pale sage background (#f3f7f2), deep green text (#1f3324), leaf-green accent (#3f8f5a), friendly rounded sans, pill buttons, soft shadows",
  },
  {
    id: "candy",
    preview:{font:"Arial, sans-serif",radius:16},
    name: "Candy",
    swatch: ["#fff5fa", "#2a1630", "#ff4f9a"],
    brief: "blush background (#fff5fa), plum text (#2a1630), hot-pink accent (#ff4f9a), playful bold sans, large rounded buttons, cheerful but readable",
  },
  {
    id: "mono",
    preview:{font:"monospace",radius:0},
    name: "Mono",
    swatch: ["#ffffff", "#111111", "#111111"],
    brief: "strict black on white, no accent colour, a monospace for numbers and a neutral sans for text, square corners, 1px black borders",
  },
];

export function withTheme(prompt: string, themeId: string | null): string {
  const theme = THEMES.find((t) => t.id === themeId);
  return theme ? `${prompt.trim()}\n\nTheme (${theme.name}): ${theme.brief}.` : prompt;
}
