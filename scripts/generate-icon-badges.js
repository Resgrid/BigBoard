/* eslint-disable no-console */
// Generates the badged app icons used by ./appIconBadge.plugin.js.
//
// Runs as its own process so the plugin can block on it with execFileSync: Jimp is
// async-only, but config resolution is synchronous and Expo's built-in icon mods read
// the badged files before any user-registered mod gets a chance to run.

const fs = require('fs');
const path = require('path');
const { addBadge } = require('app-icon-badge');

const main = async () => {
  const jobs = JSON.parse(process.argv[2]);

  for (const job of jobs) {
    fs.mkdirSync(path.dirname(job.dstPath), { recursive: true });
    await addBadge(job);

    const { size } = fs.statSync(job.dstPath);
    if (size === 0) {
      throw new Error(`Badged icon ${job.dstPath} was written empty`);
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
