import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, extname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRoot = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolvePath(projectRoot, "src");
const supportedExtensions = [".ts", ".tsx", ".js", ".mjs", ".json"];
const exactAliases = new Map([
  ["@/data/balance/breedingBalancePresets", "data/balance/breedingBalancePresetsLive"],
  ["@/data/balance/breedingEconomySimulation", "data/balance/breedingEconomySimulationNormalized"],
  ["@/data/battleEngine", "data/battleEnginePersistent"],
  ["@/data/battleMoves", "data/battleMovesExpanded"],
  ["@/data/battleOutfitter", "data/battleOutfitterActive"],
  ["@/data/battleOutfitterIntegration", "data/battleOutfitterIntegrationActive"],
  ["@/data/battleProfiles", "data/battleProfilesExpanded"],
  ["@/data/breedingRecords", "data/breedingRecordsSafe"],
  ["@/data/nursery", "data/nurseryMoveInheritanceLifecycle"],
  ["@/features/breeding/BreedingFocusedScreen", "features/breeding/BreedingFocusedScreenMoves"],
  ["@/features/breeding/BreedingScreen", "features/breeding/BreedingScreenManaged"],
  ["@/features/collection/CollectionScreen", "features/collection/CollectionScreenLedger"],
  ["@/features/habitats/HabitatScreen", "features/habitats/HabitatScreenManaged"],
  ["@/features/inventory/PlayerInventoryMenu", "features/inventory/PlayerInventoryMenuManaged"],
  ["@/features/nursery/NurseryScreen", "features/nursery/NurseryScreenMoves"],
  ["@/features/ranch/RanchHubScreen", "features/ranch/RanchHubScreenDayLoop"],
  ["@/features/ranch-office/RanchOfficeScreen", "features/ranch-office/RanchOfficeScreenLedger"],
  ["@/lib/save/localSave", "lib/save/localSaveLifecycle"],
  ["@/lib/save/saveReliability", "lib/save/saveReliabilityRanchDay"],
  ["@/state/GameProvider", "state/GameProviderRanchDay"],
]);

async function firstExistingPath(basePath) {
  const extension = extname(basePath);
  const candidates = extension
    ? [basePath]
    : [
        ...supportedExtensions.map((candidateExtension) => `${basePath}${candidateExtension}`),
        ...supportedExtensions.map((candidateExtension) => resolvePath(basePath, `index${candidateExtension}`)),
      ];

  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.R_OK);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const mapped = exactAliases.get(specifier) ?? specifier.slice(2);
    const candidate = await firstExistingPath(resolvePath(sourceRoot, mapped));
    if (!candidate) throw new Error(`Test loader could not resolve ${specifier}.`);
    return { url: pathToFileURL(candidate).href, shortCircuit: true };
  }

  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const parentPath = dirname(fileURLToPath(context.parentURL));
    const candidate = await firstExistingPath(resolvePath(parentPath, specifier));
    if (candidate) return { url: pathToFileURL(candidate).href, shortCircuit: true };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith(".css")) {
    return { format: "module", source: "export default {};", shortCircuit: true };
  }

  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    const output = ts.transpileModule(source, {
      fileName: fileURLToPath(url),
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        isolatedModules: true,
        sourceMap: false,
      },
    });
    return { format: "module", source: output.outputText, shortCircuit: true };
  }

  return defaultLoad(url, context, defaultLoad);
}
