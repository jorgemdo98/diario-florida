#!/usr/bin/env bash
# Genera un meme con memegen.link y lo guarda en img/memes/.
#
# Uso:
#   tools/meme.sh <salida.jpg> <plantilla> "línea 1" ["línea 2" ...]
#   tools/meme.sh <salida.jpg> custom "arriba" "abajo" -- <url-foto-publica>
#
# Ejemplos:
#   tools/meme.sh img/memes/2026-11-10-1.jpg drake "Ser titular" "Marcar desde el banquillo"
#   tools/meme.sh img/memes/x.jpg custom "9-0" "Y sin Kevin" -- https://usuario.github.io/diario-florida/img/ig/j7-1.jpg
#
# Plantillas: https://api.memegen.link/templates/  (drake, db, fine, pigeon, harold,
# spiderman, wonka, both, pooh, gru, woman-cat, stonks, rollsafe, astronaut, ...)
set -euo pipefail

urlenc() {
  local LC_ALL=C s="$1" out="" c i
  s="${s//_/__}"; s="${s//-/--}"; s="${s// /_}"; s="${s//\?/~q}"; s="${s//\//~s}"
  s="${s//#/~h}"; s="${s//%/~p}"; s="${s//\"/\'\'}"; s="${s//$'\n'/~n}"
  for ((i=0; i<${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      [a-zA-Z0-9._~\'-]) out+="$c" ;;
      *) out+=$(printf '%%%02X' "'$c") ;;
    esac
  done
  printf '%s' "$out"
}

out="$1"; tpl="$2"; shift 2
path=""; bg=""
while [ $# -gt 0 ]; do
  if [ "$1" = "--" ]; then bg="$2"; break; fi
  path+="/$(urlenc "$1")"; shift
done
[ -z "$path" ] && path="/_"
url="https://api.memegen.link/images/${tpl}${path}.jpg?font=impact"
[ -n "$bg" ] && url+="&background=${bg}"
mkdir -p "$(dirname "$out")"
curl -sSf -o "$out" "$url"
echo "OK $out  <-  $url"
