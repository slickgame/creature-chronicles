import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

if (process.platform !== "win32") {
  console.log("Cow alpha recovery is available on Windows only.");
  process.exit(0);
}

const scriptPath = join(resolve(process.cwd()), "scripts", "restore-cow-alpha.ps1");
if (!existsSync(scriptPath)) {
  console.error("Cow alpha recovery script not found.");
  process.exit(1);
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

console.error("Cow alpha recovery failed:", lastError?.message ?? lastError);
process.exit(1);
