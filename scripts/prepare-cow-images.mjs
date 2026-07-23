import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

if (process.platform !== "win32") {
  console.log("Cow transparency preparation skipped outside Windows.");
  process.exit(0);
}

const scriptPath = join(resolve(process.cwd()), "scripts", "remove-cow-white-background.ps1");
if (!existsSync(scriptPath)) {
  console.log("Cow transparency script not found; skipped.");
  process.exit(0);
}

const shells = ["powershell.exe", "pwsh.exe"];
let lastError;

for (const shell of shells) {
  const result = spawnSync(
    shell,
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
    { stdio: "inherit" },
  );

  if (!result.error && result.status === 0) process.exit(0);
  lastError = result.error ?? new Error(`${shell} exited with code ${result.status ?? "unknown"}`);
  if (result.error?.code !== "ENOENT") break;
}

console.error("Cow transparency preparation failed:", lastError?.message ?? lastError);
process.exit(1);
