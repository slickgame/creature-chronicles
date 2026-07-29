import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import {
  basename,
  extname,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

const projectRoot = resolve(process.cwd());
const publicRoot = join(projectRoot, "public");
const scenesRoot = join(publicRoot, "images", "breeding", "scenes");
const outcomesRoot = join(scenesRoot, "outcomes");
const generatedManifestPath = join(projectRoot, "src", "data", "generatedBreedingSceneImages.ts");
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const ignoredFiles = new Set([".ds_store", "thumbs.db", "desktop.ini"]);
const families = ["player", "feline", "canine", "bovine", "lapine", "equine"];
const creatureFamilies = families.filter((family) => family !== "player");
const validFamilySet = new Set(families);
const errors = [];
const warnings = [];
const receiverPools = new Map();
const pairPools = new Map();
const outcomePools = new Map();
let imageCount = 0;
let checkedFolderCount = 0;

function normalizeName(value) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeOutcomeFolder(folderName) {
  const normalized = normalizeName(folderName);
  if (["pregnancy", "pregnant", "success", "successful"].includes(normalized)) return "pregnancy";
  if (["failed", "failure", "not pregnant", "no pregnancy", "unsuccessful"].includes(normalized)) return "failed";
  if (["blocked", "already pregnant", "pregnancy blocked"].includes(normalized)) return "blocked";
  return null;
}

function displayPath(absolutePath) {
  return relative(projectRoot, absolutePath).split(sep).join("/");
}

function collectFolderFiles(folderPath, label, allowNested = false) {
  checkedFolderCount += 1;
  const entries = readdirSync(folderPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && !ignoredFiles.has(entry.name.toLowerCase()));
  const supported = [];
  const seenNames = new Map();

  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    const prior = seenNames.get(lowerName);
    if (prior) errors.push(`${label}: duplicate filename detected (${prior} and ${file.name}).`);
    else seenNames.set(lowerName, file.name);

    const extension = extname(file.name).toLowerCase();
    if (!supportedExtensions.has(extension)) {
      errors.push(`${label}: unsupported file format ${file.name}. Supported formats: PNG, JPG, JPEG, WEBP, GIF.`);
      continue;
    }

    const absolutePath = join(folderPath, file.name);
    validateImageFile(absolutePath, label);
    supported.push(absolutePath);
    imageCount += 1;
  }

  if (!allowNested && supported.length === 0) errors.push(`${label}: scene folder contains no supported images.`);
  return supported;
}

function validateImageFile(filePath, label) {
  let bytes;
  try {
    const stats = statSync(filePath);
    if (!stats.isFile() || stats.size <= 0) {
      errors.push(`${label}: ${basename(filePath)} is empty or unreadable.`);
      return;
    }
    bytes = readFileSync(filePath);
  } catch (error) {
    errors.push(`${label}: ${basename(filePath)} failed to load (${error instanceof Error ? error.message : String(error)}).`);
    return;
  }

  const extension = extname(filePath).toLowerCase();
  const valid = extension === ".png"
    ? bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    : extension === ".jpg" || extension === ".jpeg"
      ? bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : extension === ".gif"
        ? bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("ascii"))
        : extension === ".webp"
          ? bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP"
          : false;

  if (!valid) errors.push(`${label}: ${basename(filePath)} has an invalid ${extension.slice(1).toUpperCase()} header and may fail to load.`);
}

function publicUrl(filePath) {
  return `/${relative(publicRoot, filePath).split(sep).map(encodeURIComponent).join("/")}`;
}

function scanPairingFolders() {
  if (!existsSync(scenesRoot)) {
    errors.push("Missing public/images/breeding/scenes directory.");
    return;
  }

  const rootEntries = readdirSync(scenesRoot, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isDirectory() || entry.name.toLowerCase() === "outcomes") continue;
    const lowerName = entry.name.toLowerCase();
    if (!lowerName.endsWith(" receiver")) {
      errors.push(`Invalid breeding scene folder name: ${entry.name}. Expected <family> receiver.`);
      continue;
    }

    const receiverFamily = normalizeName(entry.name.slice(0, -" receiver".length));
    if (!validFamilySet.has(receiverFamily)) {
      errors.push(`Invalid receiver family folder: ${entry.name}. Valid families: ${families.join(", ")}.`);
      continue;
    }

    const receiverPath = join(scenesRoot, entry.name);
    const rootImages = collectFolderFiles(receiverPath, `${entry.name} root pool`, true);
    if (rootImages.length) receiverPools.set(receiverFamily, rootImages.map(publicUrl));

    let nestedImageCount = 0;
    const nested = readdirSync(receiverPath, { withFileTypes: true }).filter((item) => item.isDirectory());
    for (const giverEntry of nested) {
      const giverFamily = normalizeName(giverEntry.name);
      if (!validFamilySet.has(giverFamily)) {
        errors.push(`${entry.name}: invalid giver family folder ${giverEntry.name}. Valid families: ${families.join(", ")}.`);
        continue;
      }
      const images = collectFolderFiles(
        join(receiverPath, giverEntry.name),
        `${entry.name}/${giverEntry.name}`,
      );
      nestedImageCount += images.length;
      if (images.length) pairPools.set(`${giverFamily}_to_${receiverFamily}`, images.map(publicUrl));
    }

    if (rootImages.length + nestedImageCount === 0) {
      errors.push(`${entry.name}: receiver scene folder and all giver-specific subfolders are empty.`);
    }
  }
}

function scanOutcomeFolders() {
  if (!existsSync(outcomesRoot)) {
    errors.push("Missing public/images/breeding/scenes/outcomes directory.");
    return;
  }

  const receiverEntries = readdirSync(outcomesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const receiverEntry of receiverEntries) {
    const receiverFamily = normalizeName(receiverEntry.name);
    if (!validFamilySet.has(receiverFamily)) {
      errors.push(`Invalid outcome receiver family folder: outcomes/${receiverEntry.name}.`);
      continue;
    }

    const receiverPath = join(outcomesRoot, receiverEntry.name);
    const seenOutcomeKinds = new Set();
    const outcomeEntries = readdirSync(receiverPath, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    if (!outcomeEntries.length) errors.push(`outcomes/${receiverEntry.name}: no outcome folders found.`);

    for (const outcomeEntry of outcomeEntries) {
      const outcome = normalizeOutcomeFolder(outcomeEntry.name);
      if (!outcome) {
        errors.push(`outcomes/${receiverEntry.name}/${outcomeEntry.name}: unsupported outcome folder name.`);
        continue;
      }
      if (seenOutcomeKinds.has(outcome)) {
        errors.push(`outcomes/${receiverEntry.name}: multiple folders normalize to outcome ${outcome}.`);
      }
      seenOutcomeKinds.add(outcome);
      const images = collectFolderFiles(
        join(receiverPath, outcomeEntry.name),
        `outcomes/${receiverEntry.name}/${outcomeEntry.name}`,
      );
      if (images.length) outcomePools.set(`${receiverFamily}_${outcome}`, images.map(publicUrl));
    }
  }
}

function validateRequiredPools() {
  for (const family of creatureFamilies) {
    if (!outcomePools.get(`${family}_pregnancy`)?.length) errors.push(`Missing pregnancy outcome image pool for ${family}.`);
    if (!outcomePools.get(`${family}_failed`)?.length) errors.push(`Missing not-pregnant/failure outcome image pool for ${family}.`);
  }

  if (!outcomePools.get("player_failed")?.length) errors.push("Missing player not-pregnant/failure outcome image pool.");
  if (outcomePools.get("player_pregnancy")?.length) {
    errors.push("Player pregnancy outcome images are not allowed. Player-receiver sessions must always use failure/not-pregnant outcomes.");
  }
}

function validateFallbacksAndCombinations() {
  const fallbackPaths = {
    pairing: join(publicRoot, "images", "ui", "icons", "icon_breeding_pen_upgrade.png"),
    pregnancy: join(publicRoot, "images", "ui", "icons", "icon_pregnancy.png"),
    failed: join(publicRoot, "images", "ui", "icons", "icon_ability_trigger.png"),
  };
  for (const [kind, filePath] of Object.entries(fallbackPaths)) {
    if (!existsSync(filePath)) errors.push(`Outcome type ${kind} has no fallback asset: ${displayPath(filePath)}.`);
    else validateImageFile(filePath, `${kind} fallback`);
  }

  for (const giver of families) {
    for (const receiver of families) {
      const pairKey = `${giver}_to_${receiver}`;
      const pairingAvailable = Boolean(pairPools.get(pairKey)?.length || receiverPools.get(receiver)?.length);
      if (!pairingAvailable) {
        if (existsSync(fallbackPaths.pairing)) warnings.push(`${pairKey}: no dedicated pairing scene; global pairing fallback will be used.`);
        else errors.push(`${pairKey}: breeding combination has no valid pairing scene or fallback.`);
      }

      for (const outcome of ["failed", "blocked", "pregnancy"]) {
        if (receiver === "player" && outcome === "pregnancy") continue;
        const exact = outcomePools.get(`${receiver}_${outcome}`)?.length;
        const blockedFallback = outcome === "blocked" && outcomePools.get(`${receiver}_failed`)?.length;
        const globalFallback = outcome === "pregnancy" ? fallbackPaths.pregnancy : fallbackPaths.failed;
        if (!exact && !blockedFallback && !existsSync(globalFallback)) {
          errors.push(`${pairKey} ${outcome}: no valid outcome image or fallback.`);
        }
      }
    }
  }
}

function validateGeneratedManifest() {
  if (!existsSync(generatedManifestPath)) {
    errors.push("Generated breeding scene manifest is missing. Run npm run generate:breeding-scenes.");
    return;
  }
  const source = readFileSync(generatedManifestPath, "utf8");
  const matches = [...source.matchAll(/"(\/images\/[^"\\]*(?:\\.[^"\\]*)*)"/g)];
  const manifestPaths = new Set(matches.map((match) => JSON.parse(`"${match[1]}"`)));
  for (const url of manifestPaths) {
    const decoded = url.split("/").map((segment) => decodeURIComponent(segment)).join("/");
    const filePath = join(publicRoot, decoded.replace(/^\/+/, ""));
    if (!existsSync(filePath)) errors.push(`Manifest entry points to a deleted file: ${url}.`);
  }

  const discoveredPaths = new Set([
    ...[...receiverPools.values()].flat(),
    ...[...pairPools.values()].flat(),
    ...[...outcomePools.values()].flat(),
  ]);
  for (const url of discoveredPaths) {
    if (!manifestPaths.has(url)) errors.push(`Scene image is missing from generated manifest: ${url}.`);
  }
}

scanPairingFolders();
scanOutcomeFolders();
validateRequiredPools();
validateFallbacksAndCombinations();
validateGeneratedManifest();

const summary = {
  foldersChecked: checkedFolderCount,
  imagesChecked: imageCount,
  receiverPools: receiverPools.size,
  pairPools: pairPools.size,
  outcomePools: outcomePools.size,
  warnings: warnings.length,
  errors: errors.length,
};

console.log("Breeding asset validation summary:");
console.log(JSON.stringify(summary, null, 2));
if (warnings.length) {
  console.warn("\nWarnings:");
  for (const warning of warnings) console.warn(`- ${warning}`);
}
if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nBreeding scene assets and generated manifest are valid.");
}
