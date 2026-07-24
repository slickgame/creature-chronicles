$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$targets = @(
  (Join-Path $projectRoot "public\images\creatures\bovine\cow_profile.png"),
  (Join-Path $projectRoot "public\images\creatures\bovine\cow_portrait.png")
)

foreach ($path in $targets) {
  if (-not (Test-Path -LiteralPath $path)) {
    Write-Host "Cow image not found; skipped: $path"
    continue
  }

  $directory = Split-Path -Parent $path
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($path)
  $backupPath = Join-Path $directory "$baseName.damaged-alpha-backup.png"
  if (-not (Test-Path -LiteralPath $backupPath)) {
    Copy-Item -LiteralPath $path -Destination $backupPath
    Write-Host "Saved damaged-alpha backup: $backupPath"
  }

  $source = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $restored = [System.Drawing.Bitmap]::new(
      $source.Width,
      $source.Height,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )

    for ($y = 0; $y -lt $source.Height; $y++) {
      for ($x = 0; $x -lt $source.Width; $x++) {
        $color = $source.GetPixel($x, $y)
        $restored.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $color.R, $color.G, $color.B))
      }
    }
  }
  finally {
    $source.Dispose()
  }

  try {
    $temporaryPath = "$path.restore.tmp.png"
    $restored.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Move-Item -LiteralPath $temporaryPath -Destination $path -Force
    Write-Host "Restored hidden cow artwork and opaque white background: $path"
  }
  finally {
    $restored.Dispose()
  }
}

Write-Host "Cow artwork recovery complete. The images are intentionally opaque again so they can be edited safely from the originals."
