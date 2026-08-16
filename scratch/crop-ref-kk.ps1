Add-Type -AssemblyName System.Drawing
$src = 'D:\GutGardenBeta\.tokenicode\tmp\d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png'
$img = [System.Drawing.Image]::FromFile($src)
$w = $img.Width; $h = $img.Height
# reference 1672x941; kingkong cards bottom center
$x = 300; $y = 560; $cw = 1070; $ch = 360
if (($x + $cw) -gt $w) { $cw = $w - $x }
if (($y + $ch) -gt $h) { $ch = $h - $y }
$bmp = New-Object System.Drawing.Bitmap($cw, $ch)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$cw,$ch)), (New-Object System.Drawing.Rectangle($x,$y,$cw,$ch)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$bmp.Save('D:\GutGardenBeta\.shots\ref-kk-band.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $img.Dispose()
Write-Output "saved ref-kk-band.png ${cw}x${ch}"
