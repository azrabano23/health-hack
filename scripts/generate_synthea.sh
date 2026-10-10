#!/usr/bin/env bash
# Generate the synthetic student cohort used for the dashboard demo and the
# parameter-recovery experiment. Needs Java 17+ and the jar from download_datasets.sh.
#   bash scripts/generate_synthea.sh [N=300]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/data/raw/synthea-out"
N="${1:-300}"
cd "$OUT"
java -jar synthea-with-dependencies.jar \
  -p "$N" -a 18-24 -s 2026 \
  --exporter.fhir.export=true \
  --exporter.csv.export=true \
  --exporter.baseDirectory=./output \
  "New Jersey" "New Brunswick"
echo "FHIR bundles: $OUT/output/fhir   CSVs: $OUT/output/csv"
