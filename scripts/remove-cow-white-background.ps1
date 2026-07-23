param(
  [int]$SoftThreshold = 228,
  [int]$TransparentThreshold = 248,
  [int]$MaxChannelSpread = 28
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Test-BackgroundPixel {
  param(
    [System.Drawing.Color]$Color,
    [int]$MinimumBrightness,
    [int]$AllowedSpread
  )

  if ($Color.A -eq 0) { return $true }
  $maximum = [Math]::Max($Color.R, [Math]::Max($Color.G, $Color.B))
  $minimum = [Math]::Min($Color.R, [Math]::Min($Color.G, $Color.B))
  $brightness = ($Color.R + $Color.G + $Color.B) / 3
  return $brightness -ge $MinimumBrightness -and ($maximum - $minimum) -le $AllowedSpread
}

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

  $source = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $bitmap = New-Object System.Drawing.Bitmap(
      $source.Width,
      $source.Height,
      [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
    )
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.DrawImageUnscaled($source, 0, 0)
    }
    finally {
      $graphics.Dispose()
    }
  }
  finally {
    $source.Dispose()
  }

  try {
    $width = $bitmap.Width
    $height = $bitmap.Height
    $alreadyTransparent = $false

    for ($x = 0; $x -lt $width -and -not $alreadyTransparent; $x++) {
      if ($bitmap.GetPixel($x, 0).A -lt 250 -or $bitmap.GetPixel($x, $height - 1).A -lt 250) {
        $alreadyTransparent = $true
      }
    }
    for ($y = 0; $y -lt $height -and -not $alreadyTransparent; $y++) {
      if ($bitmap.GetPixel(0, $y).A -lt 250 -or $bitmap.GetPixel($width - 1, $y).A -lt 250) {
        $alreadyTransparent = $true
      }
    }

    if ($alreadyTransparent) {
      Write-Host "Cow image already has a transparent border; skipped: $path"
      continue
    }

    $visited = New-Object 'bool[]' ($width * $height)
    $queue = New-Object 'System.Collections.Generic.Queue[int]'

    for ($x = 0; $x -lt $width; $x++) {
      $queue.Enqueue($x)
      $queue.Enqueue((($height - 1) * $width) + $x)
    }
    for ($y = 1; $y -lt $height - 1; $y++) {
      $queue.Enqueue($y * $width)
      $queue.Enqueue(($y * $width) + ($width - 1))
    }

    $changed = 0
    while ($queue.Count -gt 0) {
      $index = $queue.Dequeue()
      if ($visited[$index]) { continue }
      $visited[$index] = $true

      $x = $index % $width
      $y = [Math]::Floor($index / $width)
      $color = $bitmap.GetPixel($x, $y)
      if (-not (Test-BackgroundPixel -Color $color -MinimumBrightness $SoftThreshold -AllowedSpread $MaxChannelSpread)) {
        continue
      }

      $brightness = ($color.R + $color.G + $color.B) / 3
      if ($brightness -ge $TransparentThreshold) {
        $alpha = 0
      }
      else {
        $range = [Math]::Max(1, $TransparentThreshold - $SoftThreshold)
        $alpha = [int][Math]::Round(255 * (($TransparentThreshold - $brightness) / $range))
        $alpha = [Math]::Max(0, [Math]::Min(255, $alpha))
      }

      $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B))
      $changed++

      if ($x -gt 0) { $queue.Enqueue($index - 1) }
      if ($x -lt $width - 1) { $queue.Enqueue($index + 1) }
      if ($y -gt 0) { $queue.Enqueue($index - $width) }
      if ($y -lt $height - 1) { $queue.Enqueue($index + $width) }
    }

    $temporaryPath = "$path.transparent.tmp.png"
    $bitmap.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Move-Item -LiteralPath $temporaryPath -Destination $path -Force
    Write-Host "Made white background transparent ($changed pixels): $path"
  }
  finally {
    $bitmap.Dispose()
  }
}
