import type { Fixture } from "@/lib/llm/mock";
import editBroken from "./edit-broken.json";
import editDark from "./edit-dark.json";
import editFix from "./edit-fix.json";
import acceptanceCounter from "./new-acceptance-counter.json";
import newPomodoro from "./new-pomodoro.json";
import newSnake from "./new-snake.json";

// Recorded runs for unit tests and offline scripts; the app never replays them. acceptanceCounter is a synthetic regression fixture, not model output.
// new-* are picked for empty projects, edit-* for existing ones; first match on the prompt wins.
export const FIXTURES: Fixture[] = [newPomodoro, newSnake, acceptanceCounter, editDark, editBroken, editFix];
