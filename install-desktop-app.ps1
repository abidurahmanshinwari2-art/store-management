$ErrorActionPreference = 'SilentlyContinue'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $root) { $root = Get-Location }
$iconPath = Join-Path $root 'store.ico'
$batPath = Join-Path $root 'start-store.bat'
$name = 'Hasan Shinwari Genral Store'

function New-StoreIcon([string]$path) {
  Add-Type -AssemblyName System.Drawing
  $size = 256
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(18, 53, 44))

  $gold = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(201, 162, 39))
  $cream = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(243, 240, 230))
  $door = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(12, 36, 30))

  $roof = @(
    (New-Object System.Drawing.Point 36, 148),
    (New-Object System.Drawing.Point 128, 42),
    (New-Object System.Drawing.Point 220, 148)
  )
  $g.FillPolygon($gold, $roof)
  $g.FillRectangle($cream, 62, 148, 132, 78)
  $g.FillRectangle($door, 108, 172, 40, 54)
  $g.FillEllipse($gold, 188, 28, 28, 28)

  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $png = $ms.ToArray()
  $ms.Dispose()
  $g.Dispose()
  $bmp.Dispose()
  $gold.Dispose()
  $cream.Dispose()
  $door.Dispose()

  $fs = [System.IO.File]::Create($path)
  $bw = New-Object System.IO.BinaryWriter $fs
  $bw.Write([uint16]0)
  $bw.Write([uint16]1)
  $bw.Write([uint16]1)
  $bw.Write([byte]0)
  $bw.Write([byte]0)
  $bw.Write([byte]0)
  $bw.Write([byte]0)
  $bw.Write([uint16]1)
  $bw.Write([uint16]32)
  $bw.Write([uint32]$png.Length)
  $bw.Write([uint32]22)
  $bw.Write($png)
  $bw.Flush()
  $fs.Close()
}

if (-not (Test-Path $batPath)) { exit 0 }
if (-not (Test-Path $iconPath)) {
  try { New-StoreIcon $iconPath } catch { }
}

function Add-StoreShortcut([string]$folder) {
  if (-not (Test-Path $folder)) { return }
  $lnkPath = Join-Path $folder "$name.lnk"
  $shell = New-Object -ComObject WScript.Shell
  $lnk = $shell.CreateShortcut($lnkPath)
  $lnk.TargetPath = $batPath
  $lnk.WorkingDirectory = $root
  $lnk.WindowStyle = 1
  $lnk.Description = 'Open the store'
  if (Test-Path $iconPath) { $lnk.IconLocation = $iconPath }
  $lnk.Save()
}

$desktop = [Environment]::GetFolderPath('Desktop')
$startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
Add-StoreShortcut $desktop
Add-StoreShortcut $startMenu
