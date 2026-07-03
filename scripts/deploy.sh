#!/usr/bin/env sh
# Deploy do Fintrix no VPS. Chamado pelo workflow (.github/workflows/deploy.yml) via ssh.
# Objetivo: build → down → migrations (com LOG visível) → app. Falha alto e cedo.
set -eu

# docker-compose v1 (1.29.2) tem o bug KeyError 'ContainerConfig' ao recriar container cuja imagem
# mudou. Por isso: down antes de up (recria do zero). Usa `docker compose` (v2) se existir.
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi
echo ">> Usando: $DC"
$DC version || true

echo ">> Build das imagens (app ainda no ar)..."
$DC build

echo ">> Derrubando containers antigos (volumes preservados)..."
$DC down --remove-orphans

echo ">> Subindo o banco..."
$DC up -d db

echo ">> Aguardando o banco ficar saudável..."
i=0
while [ "$i" -lt 40 ]; do
  cid="$($DC ps -q db 2>/dev/null || true)"
  status="starting"
  [ -n "$cid" ] && status="$(docker inspect -f '{{.State.Health.Status}}' "$cid" 2>/dev/null || echo starting)"
  if [ "$status" = "healthy" ]; then
    echo ">> Banco saudável."
    break
  fi
  i=$((i + 1))
  sleep 2
done

echo ">> Aplicando migrations (prisma migrate deploy) — log abaixo:"
echo "----------------------------------------------------------------"
# --rm: container efêmero; a saída do Prisma vai direto pro log do Actions e o exit code propaga.
if ! $DC run --rm migrate; then
  echo "----------------------------------------------------------------"
  echo ">> FALHA nas migrations. Status detalhado do Prisma:"
  $DC run --rm migrate npx prisma migrate status || true
  echo ">> (Se aparecer 'failed migration', use: prisma migrate resolve --rolled-back <nome>)"
  exit 1
fi
echo "----------------------------------------------------------------"
echo ">> Migrations OK."

echo ">> Subindo app + adminer..."
$DC up -d

echo ">> Limpando imagens órfãs..."
docker image prune -f

echo ">> Deploy concluído."
