// Preview server: `node serve.mjs` then open the printed URL to watch the scene
// play in real time (?autoplay=1). Use arrow keys / space to scrub.
import { startServer } from "./server.mjs";

const port = Number(process.env.PORT) || 4321;
const { url } = await startServer(undefined, port);
console.log(`\n  uikit launch scene — preview\n`);
console.log(`  16:9  ${url}/scene.html?autoplay=1&format=16x9`);
console.log(`  9:16  ${url}/scene.html?autoplay=1&format=9x16`);
console.log(`\n  (space = play/pause · ←/→ = scrub · Home = restart · Ctrl-C = stop)\n`);
