#!/usr/bin/env node

const { spawnSync } = require("child_process");
const readline = require("readline");
const { checkPackages } = require("./api");
const {
  getPackages,
  getDepsFromPackageJson,
  getResolvedVersion,
  packageBaseName,
} = require("./utils");

const args = process.argv.slice(2);

function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

(async () => {
  let pkgs = getPackages(args);
  if (!pkgs.length) {
    pkgs = getDepsFromPackageJson();
  }

  console.log("🔍 Running security checks...\n");

  const installOrder = [];
  const payload = [];

  for (const pkg of pkgs) {
    const name = packageBaseName(pkg);
    const version = getResolvedVersion(pkg);

    if (!version) {
      console.log(
        `⚠️ Could not resolve version for ${pkg}, installing as-is`
      );
      installOrder.push({ pkg, name, version: null, skipApi: true });
      continue;
    }

    installOrder.push({ pkg, name, version, skipApi: false });
    payload.push({ name, version });
  }

  let apiResults = [];
  if (payload.length > 0) {
    try {
      const data = await checkPackages(payload);
      apiResults = data.results || [];
    } catch (e) {
      console.error("❌ API error:", e.message);
      process.exit(1);
    }
  }

  let hasHighRisk = false;
  const finalInstallList = [];
  let resultIdx = 0;

  for (const item of installOrder) {
    if (item.skipApi) {
      finalInstallList.push(item.pkg);
      continue;
    }

    const row = apiResults[resultIdx++];
    if (!row || !row.ok) {
      console.log(`\n⚠️ No API result for ${item.name}, installing as-is`);
      finalInstallList.push(item.pkg);
      continue;
    }

    console.log(`\n🔍 Checking ${item.name}@${row.version}...`);

    let finalVersion = row.version;

    if (row.isNew) {
      console.log(
        `⚠️ ${item.name}@${row.version} was published recently (<24h)`
      );

      if (row.previousVersion) {
        const answer = await askUser(
          `👉 Install safer version ${row.previousVersion} instead? (y/n): `
        );
        if (answer === "y") {
          console.log(`✔️ Switching to safer version ${row.previousVersion}`);
          finalVersion = row.previousVersion;
        } else {
          console.log("⚠️ Proceeding with latest version...");
        }
      }
    }

    console.log(`Risk Score: ${row.risk}`);

    if (row.isNew) console.log("⚠️ Recently published package");
    if (row.hasInstallScripts) console.log("⚠️ Has install scripts");

    if (row.vulnIds && row.vulnIds.length > 0) {
      console.log("❌ Vulnerabilities found:");
      row.vulnIds.forEach((id) => console.log(`   - ${id}`));
    }

    if (row.blocked) {
      console.log("❌ BLOCKED: High risk package");
      hasHighRisk = true;
    } else if (row.level === "medium") {
      console.log("⚠️ Warning: Medium risk package");
    } else {
      console.log("✅ Safe");
    }

    const specChanged = finalVersion !== row.version;
    finalInstallList.push(
      specChanged ? `${item.name}@${finalVersion}` : item.pkg
    );
  }

  if (hasHighRisk) {
    console.log("\n🚫 Installation blocked due to high-risk packages.");
    process.exit(1);
  }

  console.log("\n📦 Final install list:", finalInstallList);
  console.log("\n🚀 Installing...\n");

  if (!getPackages(args).length) {
    spawnSync("npm", args, { stdio: "inherit" });
  } else {
    const result = spawnSync("npm", ["install", ...finalInstallList], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      console.log("❌ npm install failed");
      process.exit(1);
    }
  }
})();
