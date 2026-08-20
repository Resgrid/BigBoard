const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Local replacement for the `app-icon-badge` config plugin.
//
// The upstream plugin swaps `icon` / `adaptiveIcon.foregroundImage` to
// `.expo/app-icon-badge/*.png` but generates those files with a floating, error-swallowing
// promise. `.expo/` is gitignored, so on a clean checkout (EAS) Expo's built-in icon mods
// read the destination before Jimp has finished writing it - or before it exists at all -
// which fails prebuild with:
//   [android.dangerous]: withAndroidDangerousBaseMod: Could not find MIME for Buffer <null>
//
// Built-in mods are registered after user plugins and therefore run first, so generation
// cannot be deferred to a mod. Instead it happens here, synchronously, while the config is
// still being resolved, with the results cached so repeated config reads stay cheap.

const DST_FOLDER = '.expo/app-icon-badge';
const CACHE_FILE = `${DST_FOLDER}/.cache.json`;
const DST_ICON = `${DST_FOLDER}/icon.png`;
const DST_IOS_ICON = `${DST_FOLDER}/ios-icon.png`;
const DST_ADAPTIVE_ICON = `${DST_FOLDER}/foregroundImage.png`;

const fingerprint = (projectRoot, jobs) =>
  JSON.stringify(
    jobs.map((job) => {
      const { size, mtimeMs } = fs.statSync(path.resolve(projectRoot, job.icon));
      return { ...job, size, mtimeMs };
    })
  );

const isUpToDate = (projectRoot, expected) => {
  try {
    const cache = fs.readFileSync(path.join(projectRoot, CACHE_FILE), 'utf8');
    if (cache !== expected) return false;
  } catch {
    return false;
  }

  return [DST_ICON, DST_IOS_ICON, DST_ADAPTIVE_ICON].every((dst) => {
    const file = path.join(projectRoot, dst);
    return !fs.existsSync(file) || fs.statSync(file).size > 0;
  });
};

const withAppIconBadge = (config, options = {}) => {
  const { badges = [], enabled = true } = options;

  if (!enabled || badges.length === 0) {
    return config;
  }

  const projectRoot = config._internal?.projectRoot ?? process.cwd();
  const jobs = [];

  if (config.icon) {
    jobs.push({ icon: config.icon, dstPath: DST_ICON, badges });
    config.icon = DST_ICON;
  }

  if (config.android?.adaptiveIcon?.foregroundImage) {
    jobs.push({
      icon: config.android.adaptiveIcon.foregroundImage,
      dstPath: DST_ADAPTIVE_ICON,
      badges,
      isAdaptiveIcon: true,
    });
    config.android.adaptiveIcon.foregroundImage = DST_ADAPTIVE_ICON;
  }

  if (config.ios?.icon) {
    jobs.push({ icon: config.ios.icon, dstPath: DST_IOS_ICON, badges });
    config.ios.icon = DST_IOS_ICON;
  }

  if (jobs.length === 0) {
    return config;
  }

  const cacheKey = fingerprint(projectRoot, jobs);
  if (isUpToDate(projectRoot, cacheKey)) {
    return config;
  }

  const absoluteJobs = jobs.map((job) => ({
    ...job,
    icon: path.resolve(projectRoot, job.icon),
    dstPath: path.join(projectRoot, job.dstPath),
  }));

  execFileSync(process.execPath, [path.join(projectRoot, 'scripts', 'generate-icon-badges.js'), JSON.stringify(absoluteJobs)], {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  fs.writeFileSync(path.join(projectRoot, CACHE_FILE), cacheKey);

  return config;
};

module.exports = withAppIconBadge;
