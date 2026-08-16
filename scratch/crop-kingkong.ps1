Add-Type -AssemblyName System.Drawing
$src = 'D:\GutGardenBeta\.shots\home-current.png'
$img = [System.Drawing.Image]::FromFile($src)
$w = $img.Width; $h = $img.Height
Write-Output "orig: ${w}x${h}"
# crop kingkong band: bottom area above the growth bar. Use 1280x900 canvas.
$x = 260; $y = 400; $cw = 760; $ch = 320
if (($x + $cw) -gt $w) { $cw = $w - $x }
if (($y + $ch) -gt $h) { $ch = $h - $y }
$bmp = New-Object System.Drawing.Bitmap($cw, $ch)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, (New-Object System.Drawing.Rectangle(0,0,$cw,$ch)), (New-Object System.Drawing.Rectangle($x,$y,$cw,$ch)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
# downscale to max width 760
$bmp.Save('D:\GutGardenBeta\.shots\home-kingkong.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $img.Dispose()
Write-Output "saved .shots/home-kingkong.png ${cw}x${ch}"
