#!/usr/bin/env bash
# Genera el cartel «MVP del partido» (1080×1350 JPG) con tools/mvp.html y Chrome headless.
#
# Uso:
#   tools/mvp.sh <salida.jpg> <NOMBRE> <foto> <crop x,y,w,h> "<línea 1>" "<línea 2>" [escudo x,y,w]
#
# Ejemplo (J8):
#   tools/mvp.sh img/mvp/j8-serra.jpg SERRA img/ig/jul28-serra.jpg 840,420,500,1150 \
#     "JORNADA 8 · ROSAL 0-2 LA FLORIDA" "GOL EN EL 76' · DESDE EL BANQUILLO" 45,45,265
#
# - crop: recuadro del jugador dentro de la foto original, en píxeles.
# - escudo: si la foto es un cartel del club con el escudo, recuadro del escudo (más nítido que img/escudos).
set -euo pipefail
out="$1" nombre="$2" foto="$3" crop="$4" l1="$5" l2="$6" escudo="${7:-}"
raiz="$(cd "$(dirname "$0")/.." && pwd -W 2>/dev/null || pwd)"
chrome="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
enc() { local LC_ALL=C s="$1" o="" c i; for ((i=0;i<${#s};i++)); do c="${s:i:1}"; case "$c" in [a-zA-Z0-9._~,-]) o+="$c";; *) o+=$(printf '%%%02X' "'$c");; esac; done; printf '%s' "$o"; }
url="file:///$raiz/tools/mvp.html?nombre=$(enc "$nombre")&foto=../$(enc "$foto")&crop=$crop&linea1=$(enc "$l1")&linea2=$(enc "$l2")"
[ -n "$escudo" ] && url+="&escudo=$escudo"
png="${out%.*}.png"
mkdir -p "$(dirname "$out")"
"$chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1080,1350 --virtual-time-budget=10000 --screenshot="$(cd "$(dirname "$png")" && pwd -W 2>/dev/null || pwd)/$(basename "$png")" "$url" >/dev/null 2>&1
# PNG → JPG (calidad 88) con .NET, que viene con Windows
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; \$i=[Drawing.Image]::FromFile((Resolve-Path '$png')); \$c=[Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|?{\$_.MimeType -eq 'image/jpeg'}; \$p=New-Object Drawing.Imaging.EncoderParameters 1; \$p.Param[0]=New-Object Drawing.Imaging.EncoderParameter([Drawing.Imaging.Encoder]::Quality,[long]88); \$i.Save((Join-Path (Resolve-Path '$(dirname "$out")') '$(basename "$out")'),\$c,\$p); \$i.Dispose()"
rm -f "$png"
echo "OK $out"
