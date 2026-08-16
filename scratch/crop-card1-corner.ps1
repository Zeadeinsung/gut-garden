Add-Type -AssemblyName System.Drawing
$ref = [System.Drawing.Image]::FromFile('D:\GutGardenBeta\.tokenicode\tmp\d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png')
# card1 bbox [397,602]-[594,816]. top-left corner region
$x = 392; $y = 596; $cw = 90; $ch = 90
$scale = 4
$bmp = New-Object System.Drawing.Bitmap(($cw*$scale), ($ch*$scale))
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($ref, (New-Object System.Drawing.Rectangle(0,0,($cw*$scale),($ch*$scale))), (New-Object System.Drawing.Rectangle($x,$y,$cw,$ch)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$bmp.Save('D:\GutGardenBeta\.shots\card1-topleft.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose(); $ref.Dispose()
Write-Output 'saved card1-topleft.png'
