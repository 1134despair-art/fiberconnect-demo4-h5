Add-Type -AssemblyName System.Drawing

$iconDirectory = Join-Path $PSScriptRoot '..\src\assets\icons\pon-meter\ui'
$blue = [System.Drawing.ColorTranslator]::FromHtml('#2563EB')

function New-RoundedRectanglePath {
  param([float]$X, [float]$Y, [float]$Width, [float]$Height, [float]$Radius)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-Lines {
  param($Graphics, $Pen, [object[]]$Coordinates)
  $points = [System.Drawing.PointF[]]@()
  foreach ($coordinate in $Coordinates) {
    $points += [System.Drawing.PointF]::new([float]$coordinate[0], [float]$coordinate[1])
  }
  $Graphics.DrawLines($Pen, $points)
}

function Save-PonIcon {
  param([string]$Name, [scriptblock]$Draw)
  $bitmap = [System.Drawing.Bitmap]::new(72, 72, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.ScaleTransform(1.5, 1.5)
  $pen = [System.Drawing.Pen]::new($blue, 2.4)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $brush = [System.Drawing.SolidBrush]::new($blue)

  try {
    & $Draw $graphics $pen $brush
    $bitmap.Save((Join-Path $iconDirectory "$Name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $brush.Dispose()
    $pen.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

Save-PonIcon 'opm-meter' {
  param($g, $p, $b)
  $body = New-RoundedRectanglePath 8 7 32 34 7
  $g.DrawPath($p, $body)
  $body.Dispose()
  $g.DrawArc($p, 14, 19, 20, 20, 180, 180)
  $g.DrawLine($p, 24, 29, 30, 22)
  $g.FillEllipse($b, 21.8, 26.8, 4.4, 4.4)
  $g.DrawLine($p, 17, 13, 31, 13)
  $g.DrawLine($p, 18, 36, 30, 36)
}

Save-PonIcon 'pon-dual-channel' {
  param($g, $p, $b)
  $g.DrawLine($p, 6, 15, 16, 15)
  $g.DrawLine($p, 6, 33, 16, 33)
  $g.FillEllipse($b, 4.5, 12.5, 5, 5)
  $g.FillEllipse($b, 4.5, 30.5, 5, 5)
  $body = New-RoundedRectanglePath 16 8 25 32 6
  $g.DrawPath($p, $body)
  $body.Dispose()
  $g.DrawLine($p, 21, 17, 35, 17)
  $g.DrawLine($p, 21, 31, 35, 31)
  Draw-Lines $g $p @(@(31,13), @(35,17), @(31,21))
  Draw-Lines $g $p @(@(31,27), @(35,31), @(31,35))
}

Save-PonIcon 'unit-convert' {
  param($g, $p, $b)
  Draw-Lines $g $p @(@(9,15), @(37,15), @(31,9))
  Draw-Lines $g $p @(@(39,33), @(11,33), @(17,39))
  $g.DrawEllipse($p, 12, 22, 6, 6)
  $g.DrawLine($p, 23, 22, 37, 22)
  $g.DrawLine($p, 23, 28, 33, 28)
}

Save-PonIcon 'frequency-signal' {
  param($g, $p, $b)
  Draw-Lines $g $p @(@(5,25), @(12,25), @(16,13), @(22,37), @(28,12), @(33,31), @(37,25), @(43,25))
  $softPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(115, $blue), 2.4)
  $softPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $softPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($softPen, 8, 39, 40, 39)
  $softPen.Dispose()
}

Save-PonIcon 'manual-calibration' {
  param($g, $p, $b)
  $g.DrawEllipse($p, 11, 11, 26, 26)
  $g.DrawEllipse($p, 19, 19, 10, 10)
  $g.DrawLine($p, 24, 5, 24, 14)
  $g.DrawLine($p, 24, 34, 24, 43)
  $g.DrawLine($p, 5, 24, 14, 24)
  $g.DrawLine($p, 34, 24, 43, 24)
  $g.FillEllipse($b, 21.8, 21.8, 4.4, 4.4)
}

Save-PonIcon 'buzzer' {
  param($g, $p, $b)
  $bell = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $bell.AddLines([System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new(16,31), [System.Drawing.PointF]::new(16,22),
    [System.Drawing.PointF]::new(18,16), [System.Drawing.PointF]::new(24,14),
    [System.Drawing.PointF]::new(30,16), [System.Drawing.PointF]::new(32,22),
    [System.Drawing.PointF]::new(32,31), [System.Drawing.PointF]::new(36,36),
    [System.Drawing.PointF]::new(12,36), [System.Drawing.PointF]::new(16,31)
  ))
  $g.DrawPath($p, $bell)
  $bell.Dispose()
  $g.DrawLine($p, 21, 40, 27, 40)
  Draw-Lines $g $p @(@(14,10), @(10,16))
  Draw-Lines $g $p @(@(34,10), @(38,16))
  $softPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(140, $blue), 2.4)
  $softPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $softPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLine($softPen, 11, 6, 6, 13)
  $g.DrawLine($softPen, 37, 6, 42, 13)
  $softPen.Dispose()
}

Save-PonIcon 'screen-brightness' {
  param($g, $p, $b)
  $screen = New-RoundedRectanglePath 6 8 36 28 6
  $g.DrawPath($p, $screen)
  $screen.Dispose()
  $g.DrawEllipse($p, 19, 17, 10, 10)
  $g.DrawLine($p, 24, 12, 24, 15)
  $g.DrawLine($p, 24, 29, 24, 32)
  $g.DrawLine($p, 14, 22, 17, 22)
  $g.DrawLine($p, 31, 22, 34, 22)
  $g.DrawLine($p, 17, 15, 19, 17)
  $g.DrawLine($p, 29, 27, 31, 29)
  $g.DrawLine($p, 31, 15, 29, 17)
  $g.DrawLine($p, 19, 27, 17, 29)
  $g.DrawLine($p, 17, 41, 31, 41)
}

Save-PonIcon 'back' {
  param($g, $p, $b)
  Draw-Lines $g $p @(@(27,10), @(13,24), @(27,38))
  $g.DrawLine($p, 14, 24, 39, 24)
}

Save-PonIcon 'bluetooth' {
  param($g, $p, $b)
  Draw-Lines $g $p @(@(23,5), @(34,15), @(14,34))
  Draw-Lines $g $p @(@(14,14), @(34,33), @(23,43), @(23,5))
}

Save-PonIcon 'battery' {
  param($g, $p, $b)
  $body = New-RoundedRectanglePath 6 14 35 20 4
  $g.DrawPath($p, $body)
  $body.Dispose()
  $terminal = New-RoundedRectanglePath 41 20 3 8 1
  $g.FillPath($b, $terminal)
  $terminal.Dispose()
  $g.FillRectangle($b, 11, 19, 6, 10)
  $g.FillRectangle($b, 20, 19, 6, 10)
  $g.FillRectangle($b, 29, 19, 6, 10)
}

Save-PonIcon 'history' {
  param($g, $p, $b)
  $g.DrawArc($p, 8, 8, 32, 32, -70, 300)
  Draw-Lines $g $p @(@(9,7), @(9,16), @(18,16))
  $g.DrawLine($p, 24, 15, 24, 25)
  $g.DrawLine($p, 24, 25, 31, 29)
  $g.FillEllipse($b, 21.8, 22.8, 4.4, 4.4)
}

Save-PonIcon 'save' {
  param($g, $p, $b)
  $body = New-RoundedRectanglePath 8 7 32 34 5
  $g.DrawPath($p, $body)
  $body.Dispose()
  $g.DrawRectangle($p, 15, 7, 17, 11)
  $slot = New-RoundedRectanglePath 14 26 20 15 3
  $g.DrawPath($p, $slot)
  $slot.Dispose()
  $g.DrawLine($p, 18, 31, 30, 31)
  $g.FillRectangle($b, 27, 10, 3, 5)
}

Save-PonIcon 'flashlight' {
  param($g, $p, $b)
  $head = New-RoundedRectanglePath 14 6 20 9 3
  $g.DrawPath($p, $head)
  $head.Dispose()
  Draw-Lines $g $p @(@(17,15), @(19,22), @(19,39), @(29,39), @(29,22), @(31,15))
  $g.DrawLine($p, 19, 23, 29, 23)
  $g.DrawLine($p, 22, 28, 26, 28)
}

Save-PonIcon 'vfl' {
  param($g, $p, $b)
  $g.DrawEllipse($p, 18, 18, 12, 12)
  $g.FillEllipse($b, 21.5, 21.5, 5, 5)
  $g.DrawLine($p, 24, 5, 24, 13)
  $g.DrawLine($p, 24, 35, 24, 43)
  $g.DrawLine($p, 5, 24, 13, 24)
  $g.DrawLine($p, 35, 24, 43, 24)
  $g.DrawLine($p, 10, 10, 16, 16)
  $g.DrawLine($p, 32, 32, 38, 38)
  $g.DrawLine($p, 38, 10, 32, 16)
  $g.DrawLine($p, 16, 32, 10, 38)
}

Save-PonIcon 'settings' {
  param($g, $p, $b)
  $g.DrawEllipse($p, 12, 12, 24, 24)
  $g.DrawEllipse($p, 20, 20, 8, 8)
  $g.DrawLine($p, 24, 5, 24, 12)
  $g.DrawLine($p, 24, 36, 24, 43)
  $g.DrawLine($p, 5, 24, 12, 24)
  $g.DrawLine($p, 36, 24, 43, 24)
  $g.DrawLine($p, 11, 11, 16, 16)
  $g.DrawLine($p, 32, 32, 37, 37)
  $g.DrawLine($p, 37, 11, 32, 16)
  $g.DrawLine($p, 16, 32, 11, 37)
}

Save-PonIcon 'language' {
  param($g, $p, $b)
  $g.DrawEllipse($p, 7, 7, 34, 34)
  $g.DrawEllipse($p, 16, 7, 16, 34)
  $g.DrawLine($p, 8, 24, 40, 24)
  $g.DrawArc($p, 10, 12, 28, 14, 0, 180)
  $g.DrawArc($p, 10, 22, 28, 14, 180, 180)
}

Save-PonIcon 'timer' {
  param($g, $p, $b)
  $g.DrawEllipse($p, 9, 11, 30, 30)
  $g.DrawLine($p, 24, 5, 24, 11)
  $g.DrawLine($p, 20, 5, 28, 5)
  $g.DrawLine($p, 24, 18, 24, 26)
  $g.DrawLine($p, 24, 26, 30, 30)
  $g.FillEllipse($b, 21.8, 23.8, 4.4, 4.4)
}

Save-PonIcon 'info' {
  param($g, $p, $b)
  $g.DrawEllipse($p, 7, 7, 34, 34)
  $g.FillEllipse($b, 21.8, 13, 4.4, 4.4)
  $g.DrawLine($p, 24, 22, 24, 34)
}

Save-PonIcon 'restore' {
  param($g, $p, $b)
  $g.DrawArc($p, 8, 8, 32, 32, 25, 135)
  $g.DrawArc($p, 8, 8, 32, 32, 205, 135)
  Draw-Lines $g $p @(@(9,8), @(9,17), @(18,17))
  Draw-Lines $g $p @(@(39,40), @(39,31), @(30,31))
}

Save-PonIcon 'power-off' {
  param($g, $p, $b)
  $g.DrawLine($p, 24, 5, 24, 23)
  $g.DrawArc($p, 8, 10, 32, 32, -45, 270)
}

Save-PonIcon 'pulse-1hz' {
  param($g, $p, $b)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddBezier(5, 24, 10, 24, 10, 11, 16, 11)
  $path.AddBezier(16, 11, 22, 11, 22, 37, 28, 37)
  $path.AddBezier(28, 37, 34, 37, 34, 24, 43, 24)
  $g.DrawPath($p, $path)
  $path.Dispose()
}

Save-PonIcon 'pulse-2hz' {
  param($g, $p, $b)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddBezier(4, 24, 7, 24, 7, 12, 12, 12)
  $path.AddBezier(12, 12, 17, 12, 17, 36, 22, 36)
  $path.AddBezier(22, 36, 27, 36, 27, 12, 32, 12)
  $path.AddBezier(32, 12, 37, 12, 37, 24, 44, 24)
  $g.DrawPath($p, $path)
  $path.Dispose()
}

Save-PonIcon 'continuous-wave' {
  param($g, $p, $b)
  $g.DrawLine($p, 7, 24, 41, 24)
  $g.FillEllipse($b, 5, 22, 4, 4)
  $g.FillEllipse($b, 39, 22, 4, 4)
  $g.DrawLine($p, 14, 18, 14, 30)
  $g.DrawLine($p, 34, 18, 34, 30)
}
