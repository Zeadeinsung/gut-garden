Add-Type -AssemblyName System.Drawing
$src = 'D:\GutGardenBeta\.tokenicode\tmp\d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png'
$img = [System.Drawing.Image]::FromFile($src)
$w = $img.Width; $h = $img.Height
# card 1 region (garden card): tight crop on the roof+left edge
$x = 350; $y = 565; $cw = 230; $ch = 150
$bmp = New-Object System.Drawing.Bitmap(($cw*2), ($ch*2))
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,($cw*2),($ch*2))), (New-Object System.Drawing.Rectangle($x,$y,$cw,$ch)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$bmp.Save('D:\GutGardenBeta\.shots\ref-kk-card1-zoom.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $img.Dispose()
Write-Output "saved ref-kk-card1-zoom.png"
