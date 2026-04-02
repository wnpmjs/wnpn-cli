const { spawnSync } = require("child_process");
const fs = require("fs");

function getPackages(args) {
  const installIndex = args.findIndex(
    (arg) => arg === "install" || arg === "i"
  );
  if (installIndex === -1) return [];
  return args.slice(installIndex + 1).filter((a) => !a.startsWith("-"));
}

/** Bare package name from a spec (handles scoped names). */
function packageBaseName(spec) {
  if (spec.startsWith("@")) {
    const i = spec.indexOf("@", 1);
    return i === -1 ? spec : spec.slice(0, i);
  }
  const i = spec.lastIndexOf("@");
  return i > 0 ? spec.slice(0, i) : spec;
}

function getResolvedVersion(pkg) {
  try {
    const result = spawnSync("npm", ["view", pkg, "version"], {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (result.status !== 0 || !result.stdout) return null;
    return result.stdout.trim();
  } catch {
    return null;
  }
}

function getDepsFromPackageJson() {
  if (!fs.existsSync("package.json")) return [];
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  return [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
}

module.exports = {
  getPackages,
  packageBaseName,
  getResolvedVersion,
  getDepsFromPackageJson,
};
