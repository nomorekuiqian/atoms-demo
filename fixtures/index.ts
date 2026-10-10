import type { Fixture } from "@/lib/llm/mock";
import editBroken from "./edit-broken.json";
import editDark from "./edit-dark.json";
import editFix from "./edit-fix.json";
import newPomodoro from "./new-pomodoro.json";
import newSnake from "./new-snake.json";

// Recorded runs (Claude Haiku via OpenRouter) replayed when LLM_MOCK=1.
// new-* are picked for empty projects, edit-* for existing ones; first match on the prompt wins.
export const FIXTURES: Fixture[] = [newPomodoro, newSnake, editDark, editBroken, editFix];
