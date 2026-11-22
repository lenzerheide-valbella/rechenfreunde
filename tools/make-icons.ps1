# Erzeugt die App-Symbole (Zehnerfeld 7 + 3) als PNG im Ordner icons/
Add-Type -AssemblyName System.Drawing
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'icons'
New-Item -ItemType Directory -Force $outDir | Out-Null

function New-Icon([int]$size, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(255, 255, 138, 92)), ([System.Drawing.Color]::FromArgb(255, 242, 84, 56)), 90
  $g.FillRectangle($bg, $rect)

  $pad = $size * 0.14
  $inner = $size - 2 * $pad
  $gap = $inner * 0.06
  $d = ($inner - 4 * $gap) / 5
  $y0 = ($size - (2 * $d + 1.5 * $gap)) / 2
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $yellow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 211, 77))
  for ($i = 0; $i -lt 10; $i++) {
    $row = [math]::Floor($i / 5); $col = $i % 5
    $x = $pad + $col * ($d + $gap)
    $y = $y0 + $row * ($d + 1.5 * $gap)
    $brush = if ($i -lt 7) { $white } else { $yellow }
    $g.FillEllipse($brush, [single]$x, [single]$y, [single]$d, [single]$d)
  }
  $bmp.Save((Join-Path $outDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

New-Icon 180 'apple-touch-icon.png'
New-Icon 192 'icon-192.png'
New-Icon 512 'icon-512.png'
Write-Host "Icons erstellt in $outDir"
