# PWA — Passo a passo do Fintrix

> O Fintrix nasce como PWA (Progressive Web App): instalável no celular, cara de app, base para
> distribuir depois nas lojas. Este doc é o **guia de implantação** (executado na Fase 6, mas
> planejado desde já). Regras visuais em [theme.md](./theme.md).

## 1. Por que PWA primeiro

- Um só código (Next.js) roda como site e como "app" instalado.
- Instalável (tela inicial, splash, ícone) sem loja.
- Caminho para as lojas depois via wrapper (ex.: **TWA/Bubblewrap** no Android; empacotamento no iOS)
  reaproveitando o mesmo app.

## 2. Requisitos (checklist técnico)

- [ ] Servido em **HTTPS** (obrigatório para service worker).
- [ ] **Web App Manifest** (`manifest.webmanifest`) completo.
- [ ] **Service Worker** registrado (cache/offline).
- [ ] **Ícones** em múltiplos tamanhos (192, 512, maskable).
- [ ] **Meta tags** de viewport, theme-color e iOS.
- [ ] Passa no audit **Lighthouse → PWA** (instalável).

## 3. Manifest (exemplo alvo)

`public/manifest.webmanifest`:

```json
{
  "name": "Fintrix",
  "short_name": "Fintrix",
  "description": "Gestão financeira do casal",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0B1220",
  "theme_color": "#0E9F6E",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

> `theme_color` e `background_color` vêm do [theme.md](./theme.md) (primária teal / fundo dark).

## 4. Service worker (estratégia)

Usar **next-pwa** ou **Serwist** (travar no spec da Fase 6). Estratégias de cache:

- **App shell** (HTML/CSS/JS): `StaleWhileRevalidate`.
- **Assets estáticos** (ícones, fontes): `CacheFirst`.
- **Dados** (transações já vistas): cache de leitura para funcionar offline no básico; escrita exige
  online (import/lançamento).
- Versionar o SW e limpar caches antigos em update.

## 5. Meta tags (no layout raiz)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0E9F6E" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0B1220" media="(prefers-color-scheme: dark)" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<link rel="manifest" href="/manifest.webmanifest" />
```

`viewport-fit=cover` + `env(safe-area-inset-*)` no CSS = respeita notch/home-bar (cara de app).

## 6. Instalação e UX

- Detectar `beforeinstallprompt` e oferecer um botão "Instalar Fintrix" discreto.
- Splash screen derivada do manifest (ícone + `background_color`).
- Em `display: standalone` a barra do navegador some → sensação de app nativo.

## 7. Passo a passo de implementação (Fase 6)

1. Adicionar `next-pwa`/Serwist ao Next e configurar o build.
2. Criar `manifest.webmanifest` + gerar ícones (192/512/maskable) a partir do logo.
3. Registrar o service worker e definir estratégias de cache (seção 4).
4. Inserir meta tags iOS/theme-color no layout raiz.
5. Implementar prompt de instalação.
6. Testar offline (avião) e rodar Lighthouse PWA (meta: instalável, sem erros).
7. (Futuro) Empacotar para as lojas: Android via Bubblewrap/TWA; iOS via wrapper.

## 8. Critérios de aceite (PWA)

- [ ] App instala no Android e iOS (adicionar à tela inicial).
- [ ] Abre em modo standalone com splash e ícone corretos.
- [ ] Funciona offline no básico (ver dados já carregados; mensagem clara em ações que exigem rede).
- [ ] Lighthouse PWA sem falhas de instalabilidade.
- [ ] Respeita safe-areas (sem conteúdo sob o notch/home-bar).
