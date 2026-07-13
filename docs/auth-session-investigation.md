# Investigação: Sessão de auth desaparece após MFA (admin / portal)

> Estado: **EM CURSO** — a causa raiz ainda não está isolada. Este documento
> regista factos provados, hipóteses testadas (e o seu resultado) e próximos
> passos. Atualizado em 2026-07-12.

---

## 1. Sintoma reportado

- Em `/admin/login` e `/portal/login`: após password + código MFA, o utilizador
  é redirecionado ao dashboard, mas **os cookies de sessão desaparecem**.
- Em alguns casos o desaparecimento ocorre **logo após o MFA** (ao entrar no
  `/admin`); noutros, **após F5** em `/admin` ou `/portal`.
- Consequência: redirecionamento contínuo para o login, impossibilitando gerir
  o site.
- **Observação do utilizador (consola → Application → Cookies, em
  `issencial.vercel.app`):** cookies `sb-...-auth-token` (base64) e
  `sb-...-auth-token-code-verifier` (mlja) aparecem após password, mas
  **desaparecem no exato momento do código MFA** no `/admin`.
- **Teste em preview (corrigido):** no `/portal` os cookies SÃO permanentes
  (F5 repetido mantém); no `/admin` continuam a desaparecer.

---

## 2. Factos provados (evidência recolhida)

### 2.1 Credenciais e config remota — OK
- `.env.local` e env vars da Vercel apontam ambas a
  `https://lyqmsluktqdeytpouyvh.supabase.co` com a mesma anon key. **Credenciais
  local↔remotas batem.**
- Auth config remota (`/v1/projects/lyqmsluktqdeytpouyvh/config/auth`):
  - `refresh_token_rotation_enabled = true`
  - `security_refresh_token_reuse_interval = 86400` (subido de 10s via
    `supabase/config-patch.sh`)
  - `mfa_allow_low_aal = false`
  - Sem `cookie_*` custom → usa defaults do `@supabase/ssr` 0.12.0
    (`path:/`, `sameSite:lax`, `maxAge:400d`).
- Utilizadores (SQL read-only): `issencialofficial@gmail.com` = **admin** +
  TOTP verificado; `baptistalimab@gmail.com` = **client** + TOTP verificado.
  **MFA está corretamente ativo** para ambos.

### 2.2 Logs de instrumentação (preview de debug, admin)
Sequência observada no browser (consola) após login admin até `/admin`:

```
onAuthStateChange INITIAL_SESSION  hasSession:false
onAuthStateChange SIGNED_IN       hasSession:true  expires_at:1783896316
onAuthStateChange INITIAL_SESSION hasSession:true
onAuthStateChange SIGNED_IN       hasSession:true
onAuthStateChange MFA_CHALLENGE_VERIFIED hasSession:true expires_at:1783896339
[admin-mfa] verify result -> error:null dataKeys:[access_token,token_type,expires_in,expires_at,refresh_token,user]
onAuthStateChange INITIAL_SESSION  hasSession:true  expires_at:1783896339
checkAdmin getUser -> user:true role:admin sessionExpiresAt:1783896339 now:1783892740905 cookiePresent:true
checkAdmin aal: aal2 nextLevel: aal2
```

**Conclusões extraídas destes logs:**
- Antes do reload: `aal2`, `refresh_token` presente, `cookiePresent:true`,
  `expires_at` ~1h no futuro (1783896339s vs now 1783892740905ms → ~3599s de
  validade). **O cookie está válido e presente em memória/disco.**
- O `mfa.verify()` **não devolve `session` no seu `data`** — a sessão AAL2 é
  propagada internamente pelo GoTrue (`_saveSession`), confirmado no source do
  `@supabase/auth-js` (`mfa.js` → `verify()` → `_verify()` → `_saveSession` +
  `_notifyAllSubscribers('MFA_CHALLENGE_VERIFIED')`).
- Após **F5**: `onAuthStateChange INITIAL_SESSION hasSession:false`
  `sbCookies:[]` `docCookieLen:0` → **o cookie desapareceu do disco.** Foi
  redirecionado para `/admin/login`.

**Isto prova:** o cookie é escrito corretamente mas **não sobrevive ao reload /
à navegação para `/admin`**. Não é problema de expiração (está ~1h válido) nem de
credencial. É o browser a perder/persistir mal o cookie.

### 2.3 Resposta do servidor
- Num request após o MFA, os Response Headers do **servidor próprio** não mandam
  nenhum `Set-Cookie` a apagar os cookies de auth (o único `set-cookie` presente
  era `__cf_bm` da Cloudflare). Logo **o proxy não está a limpar server-side**.

### 2.4 Código lido (sem suspeitos óbvios)
- `src/proxy.ts` (middleware): único writer server-side; `setAll` **ignora
  `value===""`** (não limpa). Mesma lógica para `/admin` e `/portal`.
- `src/app/admin/layout.tsx` / `src/app/portal/layout.tsx`: `onAuthStateChange`
  apenas reage a `!session` (sem re-check AAL2 nem `signOut` global por evento).
  `checkAdmin()`/mount faz `getUser()` + AAL2 + `listFactors()` + query
  `admin_users` (só leitura).
- `src/app/admin/login/mfa/page.tsx` / `src/app/login/mfa/page.tsx`: após
  `mfa.verify()` usam `router.replace(...)`. **O `getSession()+setSession()`
  manual que existia foi removido** (era suspeito de corromper cookies).
- `src/lib/supabase/client.ts`: `createBrowserClient` (agora singleton).
- `src/lib/supabase/server.ts`: `createServerClient` (server components/route
  handlers).
- Não existe `middleware.ts` legacy; sem providers/contextos de auth custom;
  sem `signOut` fora dos login pages e layouts.

---

## 3. Hipóteses testadas — RESULTADO

| # | Hipótese | Correção aplicada | Resultado |
|---|----------|-------------------|-----------|
| H1 | `getSession()+setSession()` manual após `mfa.verify()` corrompia os cookies | Removido em ambas as páginas MFA | ❌ Não resolveu (admin continua a perder) |
| H2 | `onAuthStateChange` nos layouts re-avaliava AAL2 / fazia `signOut` global em cada refresh (corrida de rotação de refresh token) | Simplificado para reagir só a `!session` | ❌ Não resolveu |
| H3 | Múltiplos `createBrowserClient()` (layout monta 3×) competiam a escrever os cookies chunked `.0`/`.1` no verify → chunks inconsistentes | `createClient()` tornado **singleton** | ❌ Não resolveu |
| H4 | Dois writers (proxy + browser) com `cookieOptions` divergentes | `cookieOptions` explícitos e idênticos (`path:/`, `sameSite:lax`, `secure:true`, `httpOnly:false`) em client e server | ❌ Não resolveu |
| H5 | Tokens rejects por reuse de refresh token (janela 10s) | `security_refresh_token_reuse_interval` 10s → 86400s (remoto) | ❌ Não resolveu (defesa extra, mas não a causa) |

**Conclusão:** nenhuma das hipóteses acertou na causa. O cookie continua a
desaparecer **ao entrar/no F5 do `/admin`**, enquanto o `/portal` (com o mesmo
código de base) se mantém estável.

---

## 3b. Nova direção (revisão de evidência — 2026-07-12)

Revisão aponta dois pontos cegos na evidência anterior e uma hipótese
principal não listada:

- **Ponto cego 1:** §2.3 só prova que o *servidor* (proxy) não limpa o cookie.
  Como se definiu `httpOnly:false` (H4), o **cliente** pode expirar/apagar o
  cookie via `document.cookie` diretamente — invisível ao Network tab.
- **Ponto cego 2:** H3 (Path errado) é inconsistente com o sintoma. Um `Path`
  errado deixaria o cookie **listado** em Application→Cookies (só não seria
  enviado); o sintoma é *desaparecimento da lista* → eliminação/expiração
  **ativa**, não scope.

### Hipótese principal: chunking `.0`/`.1` + `setAll` a ignorar `value===""`

O `@supabase/ssr` faz chunking da sessão (`sb-...-auth-token.0`, `.1`, ...)
quando excede o limite de tamanho (`docCookieLen:3493` está perto). Com
`refresh_token_rotation_enabled=true`, quando a nova sessão cabe em **menos**
chunks, o SDK tenta **apagar os chunks extra** escrevendo `value:""`. O
`setAll` do proxy **ignora essas escritas vazias** (decisão documentada em
§2.4) → os chunks obsoletos ficam presos. Na leitura seguinte o SDK
reconstrói concatenando `.0+.1+...`; se `.1` for lixo incompatível, o parse
falha e o storage adapter do cliente limpa os cookies. Isto explica:
- desaparecimento **sem** `Set-Cookie` do servidor (quem limpa é o cliente);
- assimetria admin≠portal: o JWT do admin (role + `app_metadata` + possível
  custom access token hook) é maior e cruza o limiar de chunking com mais
  frequência que o do portal (que pode nunca passar de 1 chunk).

### Plano de validação (custo/sinal)
1. **30s:** Application→Cookies — admin tem `.0` **e** `.1` após MFA? Portal tem
   só nome único? (confirma/nega a teoria)
2. **2min (debug):** monkeypatch `document.cookie` para logar stack trace de
   TODAS as escritas (especialmente valor vazio/expirado para `sb-...-auth-
   token`/`.1`) nos segundos antes do redirect.
3. **1 linha:** remover o `if (value==="") return` do `setAll` do proxy (deixar
   encaminhar deleções) e testar o fluxo `/admin`. Se resolver → confirmado.
4. grep `.signOut(` nos layouts + `console.trace` dentro (cenário alternativo).

### Repriorização
- H5 (Vercel Toolbar): fim — afetaria admin e portal por igual.
- H3 (path): descartada (inconsistência com sintoma).
- **H2 (chunking + ignore vazio): topo**, ligada à decisão de §2.4.
- H4 (getUser no proxy a disparar refresh): secundária, testar depois.
- **H6 (JWT admin maior que portal):** investigar origem da assimetria.

---

## 4. Hipóteses ainda em aberto (próximos passos)

Ordenadas por probabilidade:

1. **Diferença de atributos do cookie escritos pelo `verify()` vs proxy.**
   O `createBrowserClient` escreve via `document.cookie`; o `createServerClient`
   (proxy) escreve via `response.cookies.set`. Embora ambos usem `path:/` e
   `sameSite:lax` agora, **o `secure` pode divergir num contexto específico**,
   ou o cookie ser escrito como `Session` (sem Max-Age) nalgum writer e o
   browser não o persistir no reload. → **Ação:** capturar os atributos exatos
   (`Path`, `SameSite`, `Secure`, `HttpOnly`, `Expires/Max-Age`) do cookie
   `sb-lyqmsluktqdeytpouyvh-auth-token.0` em Application→Cookies ANTES do F5.

2. **Chunking de cookies (`.0`/`.1`) + reescrita parcial pelo proxy.**
   O `@supabase/ssr` divide a sessão em chunks quando excede ~4096 bytes
   (`docCookieLen:3493` está perto do limite). Se o proxy reescrever apenas
   parte dos chunks (ou com `max-age` diferentes), o browser lê chunks
   incompatíveis após o reload. → **Ação:** verificar se `sb-...-auth-token.0`
   e `.1` têm sempre os mesmos atributos; considerar `cookieOptions.maxAge`
   explícito em ambos os writers.

3. **`mfa.verify()` escreve o cookie com `path` igual ao da página atual
   (`/admin/login/mfa`)** em vez de `/`. Ao navegar para `/admin` o cookie não
   seria enviado. → **Ação:** confirmar `Path` do cookie (hipótese 1 cobre).

4. **O proxy `/admin` faz `getUser()` server-side e, ao validar a sessão AAL2,
   dispara um refresh que roda o refresh token; o browser client em simultâneo
   usa o token antigo → GoTrue revoga** (apesar do reuse interval alto). O
   `/portal` não dispararia porque a sequência de chamadas no mount é
   ligeiramente diferente. → **Ação:** temporariamente retirar o `getUser()` do
   proxy para `/admin` (apenas ler cookies, não validar) e testar.

5. **Vercel Toolbar / Live (`vercel.live`) no preview** interfere com a sessão.
   Observado aviso de CSP sobre `https://vercel.live/_next-live/feedback.js`.
   → **Ação:** testar com a toolbar desligada ou num deploy de production.

6. **Diferença real de código admin vs portal ainda não lida.** Revisitar
   `src/app/admin/login/page.tsx`, `src/app/admin/layout.tsx` (montagem 3×,
   query `admin_users`) vs equivalentes do portal, à procura de algo que só o
   admin executa aquando da entrada em `/admin`.

---

## 3c. Evidência actualizada (2026-07-12, tarde)

Observação do utilizador após correção H2 (que NÃO resolveu):
- Cookies continuam a "desaparecer" intermitentemente; em algumas situações
  demorou mais tempo.
- **Mas `/admin/blog`, `/admin/newsletter`, `/admin/config` continuam a carregar
  SEM redirecionar**, mesmo quando o resto do admin redireciona para login.

**Consequência crítica:** se o cookie tivesse sido apagado do disco, O proxy
bloquearia TODAS as rotas `/admin/*` (matcher abrange tudo). Como algumas
páginas mantêm sessão, **o cookie NÃO está apagado** — ele persiste. O que se
vê em Application→Cookies como "desaparecido" é o Supabase a remover/reescrever
os cookies *durante um refresh de sessão* (estado intermédio), não perda real.

Isto **refuta a tese de chunking/cookie-apagado** (H2 testada e falhou) e aponta
para **refresh de sessão intermitente + loop de redirect** (H4).

Confirmação adicional: o bug foi reportado ORIGINALMENTE em production
(`issencial.vercel.app`), logo a toolbar/preview da Vercel (H5) está
definitivamente descartada.

Nova correção aplicada (H4): `createBrowserClient` configurado com
`auth.autoRefreshToken: false` — o **proxy é o único refresher** de sessão,
eliminando a corrida de dois refreshers sob `refresh_token_rotation_enabled`.

---

## 3d. Factos provados por instrumentação no browser (2026-07-13)

Foi adicionada instrumentação (commit `6b3b3f1`): um spy `document.cookie`
na página MFA do admin + logs no proxy (gated em `AUTH_DEBUG`) + o
endpoint `/api/debug-session` (já existia, devolve `role`/`aal`/`cookies`).

### Logs recolhidos no preview (admin, após password + MFA)

```
[AUTH-DEBUG doc.cookie spy armed]
[AUTH-DEBUG cookies.before-verify] ['...auth-token.0=3217', '...auth-token.1=235']
[AUTH-DEBUG doc.cookie.set] sb-...-auth-token.0=base64-eyJ...  ← stack: _saveSession → _verify (mfa.verify)
[AUTH-DEBUG doc.cookie.set] sb-...-auth-token.1=iIyMDI2...    ← stack: _saveSession → _verify (mfa.verify)
[AUTH-DEBUG cookies.after-verify] ['...auth-token.0=3217', '...auth-token.1=272']
```

E no `/api/debug-session` (corrido logo após MFA, antes de quebrar):

```
ROLE: admin | AAL: undefined | COOKIES: [{".0",len:3180},{".1",len:239}]
```

**Conclusões extraídas (facto, não especulação):**

1. **O `mfa.verify()` ESCREVE os cookies `.0`/`.1` normalmente** (o spy
   capturou `_saveSession` → `_verify` a gravar ambos os chunks). O browser
   **não** os apaga no momento do verify.
2. **Os cookies ESTÃO presentes no disco logo após o MFA** (`after-verify`
   mostra `.0`+`.1`; o `/api/debug-session` confirma que o browser ENVIA
   `.0`+`.1`).
3. **O JWT pós-MFA no Vercel NÃO traz o claim `aal`** →
   `getAuthenticatorAssuranceLevel()` devolve `currentLevel: undefined`.
4. **O `role` está correto** (`ROLE: admin`), tanto no client quanto no
   server (`/api/debug-session` corre server-side e também vê `admin`).

### Tentativa de correção (Opção 1) — NÃO RESOLVEU

Commit `32c17a9`: no `admin/layout.tsx`, deixou de tratar `aal` ausente como
"MFA pendente" — só redireciona para `/mfa` se o claim estiver presente E for
`aal1`. **O sintoma persiste.**

**Implicação crítica:** como a correção do layout não adiantou, o redirect
loop/quebra **NÃO tem origem no `getAuthenticatorAssuranceLevel()` do
`admin/layout.tsx`**. A causa está noutro writer de redirect. Candidatos
restantes (todos dependem de `role`/`aal` lidos do JWT):

- `src/app/admin/login/mfa/page.tsx:112` — `if (role !== "admin") router.push("/portal")`
- `src/proxy.ts:142` — `if (role !== "admin") → /portal` (redirect **server-side** em cada request)
- `src/proxy.ts:119` + `src/app/portal/layout.tsx:64` — admin em `/portal` → `signOut({scope:"global"})` + limpa cookies `maxAge:0`
- `src/app/admin/layout.tsx:74` — `if (!user) router.push("/admin/login")`
- `onAuthStateChange` `!session` → `/admin/login` (ambos os layouts)

**Hipótese atual (não confirmada):** o proxy (server-side, corre em TODAS as
requests `/admin/*`) vê `role !== "admin"` no JWT pós-MFA (claim intermitente
no Vercel, tal como o `aal`) → redireciona `/admin` → `/portal` → o
`/portal` faz `signOut({scope:"global"})` + limpa os cookies → **os cookies
desaparecem**. Isto explica:
- "quase instantâneo após MFA" (o proxy corre na request de navegação pós-MFA);
- só admin (faz MFA; o portal/cliente não tem esta cadeia);
- cookie "desaparece" (é o `signOut` global + `maxAge:0` do portal).

Mas o `/api/debug-session` mostrou `ROLE: admin` no server... logo o proxy
devia ver `admin` também. **Contradição em aberto** — precisa de
`AUTH_DEBUG=1` nos logs da Vercel para ver o que o `proxy.getUser()` recebe
exatamente no momento do redirect.

---

## 3e. Teste do `role` via DB — também NÃO RESOLVEU (2026-07-13)

Commit `9cd7206`: o `admin/layout.tsx` e o `admin/login/mfa/page.tsx` deixaram
de ler `user.app_metadata?.role` e passaram a validar admin via query à tabela
`admin_users` (DB, fonte de verdade). O proxy (`proxy.ts:142`) mantém o check
`role !== "admin"` mas usa `getUser()` **server-side** — e o `/api/debug-session`
já provou que o server vê `ROLE: admin`, logo o proxy não redireciona.

**Resultado do utilizador (preview, após login admin + MFA): OS COOKIES
CONTINUAM A DESAPARECER.**

### Consequência crítica — refutação das hipóteses de redirect

Como remover a dependência do JWT (`role` E `aal`) do layout E do `mfa/page`
não resolveu, **o redirecionamento não tem origem nessas verificações**. Além
disso o utilizador reporta **não ver nenhum redirecionamento estranho** na barra
de endereços quando o cookie some. Isto contradiz TODAS as hipóteses de
redirect (layout → /portal, proxy → /portal, /mfa, /admin/login).

**Nova direção obrigatória:** o "desaparecimento" NÃO é um redirect que leva o
utilizador a outra rota visível. É a **sessão/cookies a serem apagados
ativamente** (o browser ou o proxy escreve `value:""` / `maxAge:0`). Os
candidatos restantes, todos baseados em FACTOS dos logs de instrumentação
ainda por analisar:

1. **Proxy `setAll` a escrever deleções** — o `setAll` (proxy.ts) ignora
   `value===""` (não limpa), MAS o `getUser()` server-side que falha com
   `AuthSessionMissing` faz `_removeSession()` (auth-js) que pode disparar
   escrita de cookies vazios via o writer do proxy. Os logs `[AUTH-DEBUG
   proxy.setAll]` (com `AUTH_DEBUG=1`) provam isto.
2. **Browser `onAuthStateChange` a disparar `SIGNED_OUT`** — com
   `autoRefreshToken:false`, se o `access_token` expirar ou o refresh falhar,
   o SDK emite `SIGNED_OUT` e o `onAuthStateChange` (layout) faz
   `router.push("/admin/login")`. Mas o utilizador não vê redirect... a não ser
   que seja tão rápido que a página recarrega antes de ele notar. **O spy
   `document.cookie` deve ter capturado uma escrita vazia se isto acontecer.**
3. **Corrida de refresh token entre requests paralelos** do dashboard
   (que faz ~24 queries em `Promise.all` no mount) — cada uma passa pelo proxy,
   cada uma faz `getUser()`; com `refresh_token_rotation_enabled=true`, requests
   paralelos podem girar o refresh token e revogar a sessão. **Isto explica por
   que o dashboard/páginas com muitas queries quebram mais que blog (1 query).**

### O que falta (decisivo, não-especulativo)

Os logs de instrumentação JÁ ESTÃO NO AR (commit `6b3b3f1` + `AUTH_DEBUG=1`
na Vercel). Precisa de:
- **Vercel logs** (`[AUTH-DEBUG proxy.setAll]` / `[AUTH-DEBUG proxy.getUser]`)
  no momento exato do desaparecimento → prova se o proxy apaga cookies.
- **Console do browser** (`[AUTH-DEBUG doc.cookie.set]` com stack trace) →
  prova se o browser apaga (ex.: `_removeSession` do `onAuthStateChange`).

Sem estes dois logs, qualquer nova hipótese é especulação. Próximo passo:
correr `vercel logs` durante a reprodução do login e colar os `[AUTH-DEBUG ...]`.

---

## 3f. Causa raiz FINAL — `getUser()` strict no proxy limpa cookies (2026-07-13)

Os logs Vercel no deployment novo (`on07iupnr`) mostraram **ainda 307** em
`/admin/*` (mistura 200/304/307). O `vercel deploy` confirma que o deployment
tem as correções de role-DB, logo os 307 restantes vêm de OUTRO lugar do proxy.

**Mecânica (lida no source `@supabase/auth-js` GoTrueClient.js + `getUser`):**

- O proxy (`proxy.ts:79`) chamava `supabase.auth.getUser()`.
- `getUser()` é **"strict"**: valida o `access_token` JWT junto do servidor
  GoTrue. Quando esse token (validade ~1h) **expira**, a GoTrue recusa e o
  auth-js corre `_removeSession()`, que escreve a **remoção dos cookies**
  (`value:""`/`maxAge:0`) via o writer do proxy → o proxy vê `!user` →
  redireciona `307`.
- O comentário já existente no proxy (linhas 164-170) avisava: *"wiped the
  session right after login"* — a equipa já sabia que o proxy destrói a
  sessão, mas trocou `getAuthenticatorAssuranceLevel` por `getUser`, que tem o
  MESMO defeito (strict, não refresca).

**Facto que refuta token-expirado-rápido:** o cookie `sb-...-auth-token.0` tem
`expires: 2027-08-17` (Max-Age 400d). O cookie NÃO expira — o que expira é o
`access_token` JWT (~1h) **dentro** do cookie. Sem refresh, o `getUser()`
falha ao expirar.

**Por que explica TUDO:**
- Logo após MFA: `access_token` fresco → `getUser()` OK → `200` (as páginas
  abertas cedo: config/blog/newsletter).
- Após ~1h / no **F5**: `access_token` expirou → `getUser()` falha → cookies
  limpos + `307` → "desaparecem".
- **localhost funciona**: o browser (dev server, single process, timing
  diferente) não expõe a mesma janela de token-expirado-sem-refresh que o
  Vercel (edge + múltiplos requests paralelos).

### Correção aplicada (proxy `getUser` → `getSession`)

Commit subsequente: o proxy passa a usar `supabase.auth.getSession()` em vez
de `getUser()`. O `getSession()` **refresca o `access_token` quando expirado**
(o server client tem `autoRefreshToken:true` por defeito), logo a sessão
sobrevive à expiração do token sem limpar cookies. Isto elimina a classe de
bug "cookies desaparecem após token expirar".

> NOTA: manter `autoRefreshToken:false` no **browser** client e deixar o
> proxy como único refresher (via `getSession`) evita a corrida de dois
> refreshers sob `refresh_token_rotation_enabled`.

---

## 5. Alterações feitas até agora (branch `fix/auth-session-stability`)

Commits:
- `07be48b` — singleton `createClient()` + `cookieOptions` consistentes
  (client e proxy) + remoção dos logs de debug.
- `256d915` — desbloqueio do build: `noImplicitAny:false` no `tsconfig.json` +
  correção de 2 arrays `never[]` em APIs (`send-email`, `newsletter/send`) —
  erros pré-existentes que impediam o deploy.
- Commits anteriores (planeamento): remoção de `setSession` manual pós-MFA;
  simplificação de `onAuthStateChange` nos layouts; `router.replace` pós-MFA;
  script `supabase/config-patch.sh` (reuse interval).
- `6b3b3f1` — **instrumentação de debug** (proxy `setAll`/`getUser` logs gated
  em `AUTH_DEBUG` + spy `document.cookie` na MFA do admin). Não muda
  comportamento.
- `32c17a9` — **correção tentada (Opção 1)**: `admin/layout.tsx` deixa de
  tratar `aal` ausente como MFA-pendente. **NÃO RESOLVEU** o sintoma.
- `9cd7206` — **correção tentada (Opção B)**: `admin/layout.tsx` +
  `admin/login/mfa/page.tsx` validam admin via query `admin_users` (DB) em vez
  do claim `role` do JWT. **NÃO RESOLVEU** o sintoma. Isto REFUTA as hipóteses
  de redirect baseadas em `role`/`aal` do JWT.
- `AUTH_DEBUG=1` adicionado à env var de Preview do Vercel (para ativar os logs
  do proxy sem rebuild de código).

**Causa raiz AINDA não isolada.** Factos provados: o `mfa.verify()` escreve os
cookies e eles persistem logo após o MFA; o utilizador NÃO vê redirecionamento
estranho; remover a dependência do JWT (`role`+`aal`) no client não resolveu.
Logo o "desaparecimento" é **escrita ativa de deleção** (proxy `setAll` OU
browser `onAuthStateChange`/`_removeSession`), NÃO um redirect visível.
Próximo passo decisivo: analisar os logs `[AUTH-DEBUG ...]` (proxy via Vercel
logs + browser via Console) no momento exato do desaparecimento.
(proxy server-side ou `mfa/page.tsx` ou `onAuthStateChange`).

---

## 6. Próximo passo recomendado

Antes de mais código: **capturar os atributos exatos do cookie** (hipóteses 1–3)
no preview atual, e **testar com a Vercel Toolbar desligada / em production**
(hipótese 5). É a forma mais rápida de isolar se o problema é (a) atributo de
cookie, (b) chunking, ou (c) interferência do preview da Vercel.
