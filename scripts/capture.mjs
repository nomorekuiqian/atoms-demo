// Full-page screenshot at an emulated viewport via Chrome DevTools Protocol.
// Usage: node scripts/capture.mjs <url> <out.png> [width=375] [height=812] [scale=2]
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const [url, out, w = "375", h = "812", s = "2"] = process.argv.slice(2);
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/atoms-capture-${port}`, "about:blank"], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

const width = Number(w), height = Number(h), scale = Number(s);
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: width < 768 });
await send("Page.enable");
await send("Page.navigate", { url });
await sleep(4000);
const { cssContentSize } = await send("Page.getLayoutMetrics");
const shot = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width, height: Math.ceil(cssContentSize.height), scale: 1 },
});
await writeFile(out, Buffer.from(shot.data, "base64"));
console.log(`${out}: ${width}x${Math.ceil(cssContentSize.height)} css px @${scale}x, scrollWidth check:`,
  (await send("Runtime.evaluate", { expression: "document.documentElement.scrollWidth", returnByValue: true })).result.value);
ws.close();
chrome.kill();
