Add-Type -AssemblyName System.Drawing
$ref = [System.Drawing.Image]::FromFile('D:\GutGardenBeta\.tokenicode\tmp\d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png')
# card1 bbox
$bx = 397; $by = 602; $bw = 198; $bh = 215
$bmp = New-Object System.Drawing.Bitmap($bw, $bh)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($ref, (New-Object System.Drawing.Rectangle(0,0,$bw,$bh)), (New-Object System.Drawing.Rectangle($bx,$by,$bw,$bh)), [System.Drawing.GraphicsUnit]::Pixel)
# overlay polygon in red (from kk-poly-clean.txt, percent -> px)
$txt = Get-Content 'D:\GutGardenBeta\scratch\kk-poly-clean.txt' -Raw
$txt = $txt -replace 'polygon\(','' -replace '\)$',''
$pairs = $txt -split ',\s*'
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,255,0,0), 2)
$first = $null; $prev = $null
foreach ($pair in $pairs) {
  $parts = $pair -split ' '
  $px = [double]($parts[0] -replace '%','') / 100.0 * $bw
  $py = [double]($parts[1] -replace '%','') / 100.0 * $bh
  $pt = New-Object System.Drawing.PointF($px, $py)
  if (-not $first) { $first = $pt }
  if ($prev) { $g.DrawLine($pen, $prev, $pt) }
  $prev = $pt
}
if ($first -and $prev) { $g.DrawLine($pen, $prev, $first) }
$g.Dispose()
$bmp.Save('D:\GutGardenBeta\.shots\card1-overlay.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $ref.Dispose()
Write-Output 'saved card1-overlay.png'
