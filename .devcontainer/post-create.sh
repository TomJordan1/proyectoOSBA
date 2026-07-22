#!/usr/bin/env bash
# Se ejecuta al crear el contenedor de desarrollo. Instala SAM CLI y dependencias.
# NADA de esto toca AWS ni credenciales; es solo tooling local.
set -euo pipefail

echo "== Instalando AWS SAM CLI =="
curl -Lo /tmp/sam.zip https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip -q /tmp/sam.zip -d /tmp/sam-install
sudo /tmp/sam-install/install || sudo /tmp/sam-install/install --update
sam --version || true

echo "== Instalando dependencias del backend =="
cd "$(dirname "$0")/../backend" && npm install --no-audit --no-fund

echo "== Listo. Verifica versiones: =="
node --version; dotnet --version; sam --version || true
