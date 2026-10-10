#!/usr/bin/env bash
# Download every dataset the build uses into data/raw/ (git-ignored).
# Run on a laptop with normal internet. Re-runnable; skips files that exist.
#
#   bash scripts/download_datasets.sh            # core sets only (CGMacros, MHEALTH, SDOH, Synthea jar)
#   bash scripts/download_datasets.sh --all      # also eICU demo, SynPUF sample, HFMD (not used by the build)
#
# Two sets need a human:
#   1. MetaboNet (public subset): register at https://metabo-net.org/ and download the parquet,
#      OR use the Rutgers SharePoint link in Discord (NetID login). Put it at data/raw/metabonet/.
#   2. CGMacros via the Rutgers SharePoint link (NetID) if PhysioNet is slow; same layout as below.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/data/raw"
mkdir -p "$RAW"
ALL="${1:-}"

say() { printf '\n==> %s\n' "$*"; }

# --- CGMacros (PhysioNet v1.0.0, open, ODbL) --------------------------------
# 45 adults (15 healthy / 16 prediabetes / 14 T2D), 10 days, two CGMs, Fitbit HR, meal photos, macros.
# Participants 24, 25, 37, 40 did not complete the study and are absent.
if [ ! -d "$RAW/cgmacros/physionet.org/files/cgmacros/1.0.0" ]; then
  say "CGMacros from PhysioNet"
  mkdir -p "$RAW/cgmacros"
  ( cd "$RAW/cgmacros" && wget -r -N -c -np -q --show-progress https://physionet.org/files/cgmacros/1.0.0/ )
else say "CGMacros present"; fi

# --- MHEALTH (UCI #319) ------------------------------------------------------
if [ ! -f "$RAW/mhealth/mhealth+dataset.zip" ]; then
  say "MHEALTH from UCI"
  mkdir -p "$RAW/mhealth"
  curl -L -o "$RAW/mhealth/mhealth+dataset.zip" "https://archive.ics.uci.edu/static/public/319/mhealth+dataset.zip"
  ( cd "$RAW/mhealth" && unzip -o -q mhealth+dataset.zip )
else say "MHEALTH present"; fi

# --- AHRQ SDOH (county + ZIP files; latest year on the page) -----------------
# The AHRQ page lists year-specific XLSX/CSV downloads; grab the latest ZIP-level and county-level files.
# https://www.ahrq.gov/sdoh/data-analytics/sdoh-data.html#download
say "AHRQ SDOH: open https://www.ahrq.gov/sdoh/data-analytics/sdoh-data.html#download and save the latest"
say "  'SDOH ZIP Code' and 'SDOH County' files into $RAW/sdoh/  (links change; not scripted)"
mkdir -p "$RAW/sdoh"

# --- Synthea (jar; generation happens in scripts/generate_synthea.sh) --------
if [ ! -f "$RAW/synthea-out/synthea-with-dependencies.jar" ]; then
  say "Synthea jar"
  mkdir -p "$RAW/synthea-out"
  curl -L -o "$RAW/synthea-out/synthea-with-dependencies.jar" \
    https://github.com/synthetichealth/synthea/releases/download/master-branch-latest/synthea-with-dependencies.jar
else say "Synthea jar present"; fi

if [ "$ALL" = "--all" ]; then
  # --- eICU demo (PhysioNet, open) — not used by the build; here for completeness
  if [ ! -d "$RAW/eicu-demo" ]; then
    say "eICU demo"; mkdir -p "$RAW/eicu-demo"
    ( cd "$RAW/eicu-demo" && wget -r -N -c -np -q --show-progress https://physionet.org/files/eicu-crd-demo/2.0.1/ )
  fi
  # --- CMS DE-SynPUF sample 1 (2008-2010 synthetic claims) — not used by the build
  say "CMS DE-SynPUF: download Sample 1 ZIPs from the CMS page (links are behind a JS page):"
  say "  https://www.cms.gov/data-research/statistics-trends-and-reports/medicare-claims-synthetic-public-use-files/cms-2008-2010-data-entrepreneurs-synthetic-public-use-file-de-synpuf"
  # --- AHRQ HFMD — not used by the build
  say "AHRQ HFMD: https://www.ahrq.gov/data/innovations/hfmd.html (XLSX)"
fi

say "Done. Layout:"
find "$RAW" -maxdepth 2 -mindepth 1 -type d | sort
