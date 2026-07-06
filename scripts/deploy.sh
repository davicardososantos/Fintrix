#!/usr/bin/env sh
# Deploy do Fintrix no VPS. Chamado pelo workflow (.github/workflows/deploy.yml) via ssh.
#
# Princípio (pós-incidente do 502): NUNCA derrubar o app que está no ar antes de validar que o
# novo sobe. Ordem: build → migrations GATED (app antigo ainda servindo) → só então recria os
# containers → healthcheck de verdade. Assim, migration/imagem quebrada faz o deploy FALHAR sem
# derrubar o site (o app antigo continua respondendo).
set -eu

# docker-compose v1 (1.29.2) tem o bug KeyError 'ContainerConfig' ao recriar container cuja imagem
# mudou. Por isso usamos down+up (recria do zero) na etapa de recriação. Usa `docker compose` (v2)
# se existir — aí dava pra trocar por só `up -d`, mas mantemos down+up por compatibilidade.
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi
echo ">> Usando: $DC"

echo ">> [1/4] Build da imagem nova (app antigo continua no ar)..."
$DC build

echo ">> [2/4] Garantindo o banco no ar e saudável..."
$DC up -d db
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

echo ">> [3/4] Migrations GATED (prisma migrate deploy) — app antigo AINDA no ar. Log abaixo:"
echo "----------------------------------------------------------------"
# --rm: container efêmero; a saída do Prisma vai direto pro log do Actions e o exit code propaga.
if ! $DC run --rm migrate; then
  echo "----------------------------------------------------------------"
  echo ">> FALHA nas migrations. O app ANTIGO continua servindo (ZERO downtime)."
  echo ">> Status detalhado do Prisma:"
  $DC run --rm migrate npx prisma migrate status || true
  echo ">> (Se houver 'failed migration', resolva com: prisma migrate resolve --rolled-back <nome>)"
  exit 1
fi
echo "----------------------------------------------------------------"
echo ">> Migrations OK. Recriando containers com a imagem nova..."

# Só chega aqui se a migration passou. Recria (down+up por causa do bug ContainerConfig do v1).
$DC down --remove-orphans
$DC up -d

echo ">> [4/4] Healthcheck — o app precisa RESPONDER de verdade na porta 3100..."
ok=0
for i in $(seq 1 20); do
  if curl -fsS -o /dev/null "http://localhost:3100/"; then
    echo ">> App OK na 3100."
    ok=1
    break
  fi
  echo ">> Aguardando app subir ($i/20)..."
  sleep 3
done
if [ "$ok" -ne 1 ]; then
  echo ">> ERRO: app não respondeu na 3100. Últimos logs do app:"
  docker logs fintrix_app --tail 80 || true
  exit 1
fi

docker image prune -f
echo ">> Deploy concluído com sucesso."
