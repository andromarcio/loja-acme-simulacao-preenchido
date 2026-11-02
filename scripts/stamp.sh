#!/usr/bin/env bash
#
# stamp.sh — insere ou atualiza o carimbo de versão (invisível) num artefato.
#
# O carimbo é um comentário HTML na primeira linha do arquivo:
#   <!-- docqui: 6.2.1 | prompt: PROMPT_3A | atualizado: 2026-07-10 -->
# Invisível no documento renderizado (PDF/HTML/preview), legível só no source .md.
# Carimbos legados `doc-template-engine:` (1.x) são reconhecidos e migrados para
# o prefixo atual ao re-carimbar. Carimbos empilhados no
# topo (o que este script deixava ao não reconhecer o prefixo da 1.x) viram um só.
# Ver engine/VERSIONING.md.
#
set -euo pipefail

ENGINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat <<EOF
Uso: $0 <arquivo.md> <PROMPT_ID>

Lê a versão de $ENGINE_DIR/VERSION e grava (ou reescreve) o carimbo na
primeira linha de <arquivo.md>. Idempotente: rodar de novo só atualiza versão/data.

Exemplo:
  $0 ../simpf-doc/modules/cadastro/clientes/f-cadastrar-cliente.md PROMPT_3A
EOF
}

if [[ $# -ne 2 || "$1" =~ ^(-h|--help)$ ]]; then
  usage
  [[ "${1:-}" =~ ^(-h|--help)$ ]] && exit 0 || exit 1
fi

FILE="$1"
PROMPT_ID="$2"

if [[ ! -f "$ENGINE_DIR/VERSION" ]]; then
  echo "erro: $ENGINE_DIR/VERSION não encontrado" >&2
  exit 1
fi
if [[ ! -f "$FILE" ]]; then
  echo "erro: arquivo '$FILE' não existe" >&2
  exit 1
fi

VERSION="$(tr -d '[:space:]' < "$ENGINE_DIR/VERSION")"
TODAY="$(date +%F)"
STAMP="<!-- docqui: ${VERSION} | prompt: ${PROMPT_ID} | atualizado: ${TODAY} -->"

RE_CARIMBO='^<!-- (docqui|doc-template-engine):'
tmp="$(mktemp)"
printf '%s\n' "$STAMP" > "$tmp"
if head -n 1 "$FILE" | grep -qE "$RE_CARIMBO"; then
  # Reescreve o carimbo existente — e os empilhados logo abaixo dele —, preserva o resto.
  awk -v re="$RE_CARIMBO" 'BEGIN { topo = 1 } topo && $0 ~ re { next } { topo = 0; print }' "$FILE" >> "$tmp"
  echo "carimbo atualizado → $FILE"
else
  # Insere carimbo no topo.
  cat "$FILE" >> "$tmp"
  echo "carimbo inserido → $FILE"
fi
cat "$tmp" > "$FILE"
rm -f "$tmp"
