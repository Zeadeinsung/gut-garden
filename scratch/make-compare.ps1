Add-Type -AssemblyName System.Drawing
# crop reference card 1
$ref = [System.Drawing.Image]::FromFile('D:\GutGardenBeta\.tokenicode\tmp\d64ffc3b0ffe0d145a43a8eb6fdbd73_17859188931385.png')
$card = New-Object System.Drawing.Bitmap(198, 215)
$g = [System.Drawing.Graphics]::FromImage($card)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($ref, (New-Object System.Drawing.Rectangle(0,0,198,215)), (New-Object System.Drawing.Rectangle(397,602,198,215)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
# canvas: side by side with labels
$mine = [System.Drawing.Image]::FromFile('D:\GutGardenBeta\.shots\kk-preview2.png')
$cw = 198 + 60 + 200; $ch = 260
$cmp = New-Object System.Drawing.Bitmap($cw, $ch)
$g2 = [System.Drawing.Graphics]::FromImage($cmp)
$g2.Clear([System.Drawing.Color]::White)
$g2.DrawImage($card, 0, 20, 198, 215)
$g2.DrawString('REFERENCE', (New-Object System.Drawing.Font('Arial',14)), [System.Drawing.Brushes]::Black, 30, 2)
$g2.DrawImage($mine, 258, 22, 200, 215)
$g2.DrawString('MINE', (New-Object System.Drawing.Font('Arial',14)), [System.Drawing.Brushes]::Black, 320, 2)
$g2.Dispose()
$cmp.Save('D:\GutGardenBeta\.shots\kk-compare.png', [System.Drawing.Imaging.ImageFormat]::Png)
$cmp.Dispose(); $card.Dispose(); $ref.Dispose(); $mine.Dispose()
Write-Output 'saved kk-compare.png'
