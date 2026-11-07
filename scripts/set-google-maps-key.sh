#!/usr/bin/env bash
# T08 · pune cheia de browser Google Maps în secretul GOOGLE_MAPS_KEY al repo-ului (o folosește deploy.yml la build).
# Cheia se tastează aici, ascuns; nu se lipește în chat și nu intră în git.
# Pentru aplicația mobilă (build local), pune aceeași cheie în .env.local: VITE_GOOGLE_MAPS_KEY=...
set -euo pipefail
REPO="${REPO:-HACK4ARAD/AradEx-Frontend}"

gh auth status >/dev/null 2>&1 || { echo "Rulează întâi: gh auth login" >&2; exit 1; }
read -r -s -p "Cheia Google Maps (Maps JavaScript API): " KEY; echo
[[ "$KEY" =~ ^AIza[0-9A-Za-z_-]{35}$ ]] || { echo "Nu arată ca o cheie Google (AIza… , 39 de caractere)." >&2; exit 1; }
printf '%s' "$KEY" | gh secret set GOOGLE_MAPS_KEY -R "$REPO"
echo "Gata: GOOGLE_MAPS_KEY e setat în $REPO. Harta Google apare după următorul deploy (push pe main sau Run workflow)."
