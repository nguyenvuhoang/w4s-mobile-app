const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const args = require("minimist")(process.argv.slice(2));

interface VersionData {
  major: number;
  minor: number;
  patch: number;
}

const basePath = path.resolve(__dirname, "..");
const versionPath = path.join(basePath, "version.json");
const outputPath = path.join(basePath, "app-version.json");
const changelogPath = path.join(basePath, "changelog.md");

console.log("🔧 Bumping version...");

// 🧠 Lấy commit gần nhất
let commitMessage = "";
try {
  commitMessage = execSync("git log -1 --pretty=%B").toString().trim();
  console.log("📝 Last commit message:", commitMessage);
} catch {
  console.warn("⚠️ Unable to read git commit");
}

// 🎯 Ưu tiên flag CLI nếu có
let bumpType: "major" | "minor" | "patch" = "patch";

if (args.major) bumpType = "major";
else if (args.minor) bumpType = "minor";
else if (/BREAKING CHANGE:/i.test(commitMessage)) bumpType = "major";
else if (/^feat:/i.test(commitMessage)) bumpType = "minor";
else bumpType = "patch"; // default

const versionData: VersionData = JSON.parse(fs.readFileSync(versionPath, "utf8"));

if (bumpType === "major") {
  versionData.major += 1;
  versionData.minor = 0;
  versionData.patch = 0;
} else if (bumpType === "minor") {
  versionData.minor += 1;
  versionData.patch = 0;
} else {
  versionData.patch += 1;
}

const versionName = `${versionData.major}.${versionData.minor}.${versionData.patch}`;
const versionCode = versionData.major * 10000 + versionData.minor * 100 + versionData.patch;

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
fs.writeFileSync(outputPath, JSON.stringify({ versionName, versionCode }, null, 2));

// ✍️ Ghi changelog
const timestamp = new Date().toISOString();
const user = args.user || process.env.USER || process.env.USERNAME || "unknown";
const note = args.note || commitMessage;

const logEntry = `| ${timestamp} | ${versionName} | ${versionCode} | ${user} | ${note} |\n`;

let changelogContent = "";
if (!fs.existsSync(changelogPath)) {
  changelogContent += "# 📦 Version Changelog\n\n";
  changelogContent += "| Time (UTC)           | Version | Code   | User    | Note |\n";
  changelogContent += "|----------------------|---------|--------|---------|------|\n";
} else {
  changelogContent = fs.readFileSync(changelogPath, "utf8");
}

changelogContent += logEntry;
fs.writeFileSync(changelogPath, changelogContent, "utf8");

console.log(`✅ Auto-bumped (${bumpType}) → version: ${versionName}, code: ${versionCode}`);
