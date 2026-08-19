param(
    [int]$Scale = 4
)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root "provenance\pgattic-smb1-disasm"
$output = Join-Path $root "images"
$palette = @(
    [System.Drawing.Color]::FromArgb(255, 15, 15, 15),
    [System.Drawing.Color]::FromArgb(255, 84, 84, 84),
    [System.Drawing.Color]::FromArgb(255, 174, 174, 174),
    [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
)

function Convert-NesChrToPng {
    param(
        [string]$InputPath,
        [string]$OutputPath
    )

    $bytes = [System.IO.File]::ReadAllBytes($InputPath)
    if (($bytes.Length % 16) -ne 0) {
        throw "CHR length must be divisible by 16: $InputPath"
    }

    $tileCount = [int]($bytes.Length / 16)
    $columns = 16
    $rows = [int][Math]::Ceiling($tileCount / $columns)
    $bitmap = [System.Drawing.Bitmap]::new($columns * 8 * $Scale, $rows * 8 * $Scale)

    try {
        for ($tile = 0; $tile -lt $tileCount; $tile += 1) {
            $tileX = ($tile % $columns) * 8 * $Scale
            $tileY = [Math]::Floor($tile / $columns) * 8 * $Scale
            $offset = $tile * 16
            for ($y = 0; $y -lt 8; $y += 1) {
                $plane0 = $bytes[$offset + $y]
                $plane1 = $bytes[$offset + 8 + $y]
                for ($x = 0; $x -lt 8; $x += 1) {
                    $shift = 7 - $x
                    $index = (($plane0 -shr $shift) -band 1) -bor ((($plane1 -shr $shift) -band 1) -shl 1)
                    for ($dy = 0; $dy -lt $Scale; $dy += 1) {
                        for ($dx = 0; $dx -lt $Scale; $dx += 1) {
                            $bitmap.SetPixel($tileX + $x * $Scale + $dx, $tileY + $y * $Scale + $dy, $palette[$index])
                        }
                    }
                }
            }
        }
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
        $bitmap.Dispose()
    }
}

Convert-NesChrToPng `
    -InputPath (Join-Path $source "bg.chr") `
    -OutputPath (Join-Path $output "nes-bg-chr-index-preview.png")

Convert-NesChrToPng `
    -InputPath (Join-Path $source "sprites.chr") `
    -OutputPath (Join-Path $output "nes-sprites-chr-index-preview.png")

Write-Output "Rendered NES CHR previews to $output"
