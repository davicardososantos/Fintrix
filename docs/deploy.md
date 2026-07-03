# Deploy — Fintrix (VPS Hostinger)

> Como publicar o Fintrix no VPS via GitHub Actions. O workflow está em
> [.github/workflows/deploy.yml](../.github/workflows/deploy.yml). Estratégia: **rsync do código +
> build no servidor** com `docker compose`. Roda a cada push na `main`.

## Como funciona

1. Push na `main` → o GitHub Actions:
   - conecta no VPS via **chave SSH**;
   - **rsync** dos arquivos do repositório para `DEPLOY_PATH` (preservando o `.env` do servidor);
   - `docker compose up -d --build` → reconstrói a imagem, o serviço `migrate` aplica as migrations
     e o `app` sobe. `docker image prune -f` limpa imagens antigas.

O app usa as portas dedicadas (app **3100**, MySQL **3310**, Adminer **8090**), rede `fintrix_net`
e containers `fintrix_*` — sem colidir com os stacks nutrix/codetrix/proxy-manager já no servidor.

## 1. Secrets do GitHub (Settings → Secrets and variables → Actions)

| Secret | O que é |
|---|---|
| `SSH_PRIVATE_KEY` | **Chave privada** SSH (conteúdo do arquivo, ex. `id_ed25519`). **Não** é a senha. |
| `HOSTINGER_IP` | IP (ou hostname) do VPS — o mesmo que você usa no SSH. |
| `SSH_USER` | Usuário SSH (ex.: `root`). |
| `SSH_PORT` | Porta SSH (opcional; padrão `22`). |
| `DEPLOY_PATH` | Pasta do projeto no servidor (ex.: `/root/fintrix`). |

### Gerando o par de chaves (na sua máquina)
```bash
ssh-keygen -t ed25519 -C "fintrix-deploy" -f ./fintrix_deploy
# → fintrix_deploy (privada) e fintrix_deploy.pub (pública)
```
- Cole o conteúdo de **`fintrix_deploy`** (privada) no secret `SSH_PRIVATE_KEY`.
- Adicione a **pública** no servidor:
```bash
ssh-copy-id -i fintrix_deploy.pub USUARIO@IP     # ou cole manualmente em ~/.ssh/authorized_keys
```

## 2. Preparar o servidor (uma vez)

```bash
ssh USUARIO@IP
mkdir -p /root/fintrix            # = DEPLOY_PATH
cd /root/fintrix
# Crie o .env de produção (NÃO vai pelo CI). Use docs/.env.production.example como base:
nano .env
```
Preencha o `.env` com senhas fortes, `AUTH_SECRET` (`openssl rand -base64 33`), `AUTH_URL` com o
domínio público, e a `GEMINI_API_KEY`. Ver [.env.production.example](../.env.production.example).

> Pré-requisitos no VPS: **Docker** + **docker compose v2** instalados (o servidor já roda Docker).

## 3. Domínio + HTTPS (Nginx Proxy Manager)

O VPS já tem o **Nginx Proxy Manager** (portas 80/443). No painel dele, crie um **Proxy Host**:
- **Domain**: `fintrix.seudominio.com.br` (aponte o DNS do domínio para o IP do VPS antes).
- **Forward**: para o app do Fintrix. Duas opções:
  - **(a)** conecte o container do NPM à rede `fintrix_net` e use `Forward Hostname = fintrix_app`,
    `Forward Port = 3000`; **ou**
  - **(b)** `Forward Hostname = <IP interno/host>`, `Forward Port = 3100`.
- **SSL**: aba SSL → "Request a new certificate" (Let's Encrypt) + Force SSL.
- Garanta que `AUTH_URL` no `.env` seja exatamente esse domínio `https://...`.

## 4. Primeiro deploy

1. Commit + push de tudo na `main`.
2. Acompanhe em **GitHub → Actions**. (Ou rode manualmente em *Run workflow*.)
3. No servidor, confira:
```bash
cd /root/fintrix && docker compose ps
docker logs fintrix_app --tail 50
```
4. Acesse pelo domínio. Como o cadastro público está desativado, crie os usuários manualmente
   (INSERT no MySQL com `passwordHash` bcrypt — ver seção no README / peça o script `create-user`).

## Rollback / manutenção

```bash
cd /root/fintrix
docker compose logs -f app            # ver logs
docker compose restart app            # reiniciar só o app
docker compose down                   # parar tudo (o volume do banco persiste)
```
Para voltar a uma versão anterior: `git`-reset no servidor não se aplica (usamos rsync); reverta o
commit na `main` e deixe o deploy rodar de novo.

## Notas

- O **build roda no VPS**. Se faltar RAM (Next build pesa ~1–2 GB), a alternativa é construir a
  imagem no CI e publicar num registry (GHCR) — fica como evolução futura.
- O `.env` do servidor é **preservado** pelo rsync (está no `--exclude`). Nunca é sobrescrito.
- O volume `fintrix_db_data` persiste os dados do MySQL entre deploys.
