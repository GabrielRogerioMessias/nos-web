# Mudanças

## [Fase 2 — Ajuste LGPD] Confirmação reforçada de exclusão

**Data:** 2026-04-22

### O que foi feito
Atualizado o modal de exclusão de conta para usar uma confirmação explícita por digitação de `DELETE`, com texto mais direto e lista dos dados que serão apagados.
Revisada a palavra de confirmação para `EXCLUIR`, deixando a experiência em português.

### Arquivos modificados
- `app/(app)/profile/page.tsx` — modal de exclusão revisado com novo título, conteúdo, campo de confirmação e botão destrutivo bloqueado até validação.

## [Fase 2 — Tarefa 2.4.b] Zona de Perigo LGPD no Perfil

**Data:** 2026-04-22

### O que foi feito
Implementada a seção "Dados e Privacidade" no Perfil, com exportação dos dados do usuário em JSON e exclusão permanente de conta protegida por confirmação em modal.

### Arquivos modificados
- `app/(app)/profile/page.tsx` — adicionada a seção de privacidade, fluxo de download via blob, modal de confirmação destrutiva e limpeza de sessão após exclusão.
- `lib/user.ts` — adicionadas as funções `exportUserData()` e `deleteAccount()` para consumir os endpoints LGPD.

### Decisões arquiteturais
- Reutilizado o `Modal` e o `ToastContainer` existentes no projeto, sem instalar bibliotecas novas.
- Exportação implementada com `responseType: "blob"` e `URL.createObjectURL` para forçar o download de `meus-dados-nos.json`.

## [Fase 2 — Tarefa 2.1.b] Onboarding Express — Ajustes cirúrgicos

**Data:** 2026-04-20

### O que foi feito
Refinamentos no OnboardingFlow: saldo opcional no Passo 1, opção de pular cartão no Passo 2, duas variantes do Passo 3 (com/sem cartão), finalização com `POST /users/me/complete-onboarding` e gatilho substituído por `onboardingCompleted` do UserResponse.

### Arquivos modificados
- `types/auth.ts` — adicionado `onboardingCompleted: boolean` em `UserResponse`.
- `lib/user.ts` — adicionado `completeOnboarding()` com `POST /users/me/complete-onboarding`.
- `components/onboarding/OnboardingFlow.tsx` — Passo 1 com campo de saldo opcional (máscara `maskCurrency`) e detecção de conta existente; Passo 2 com botão "Não tenho cartão" e detecção de cartão existente; Passo 3 com variante com cofre (`Step3WithCard`) e sem cofre (`Step3WithoutCard`); finalização unificada chama `completeOnboarding()` com tratamento de erro.
- `components/onboarding/OnboardingGate.tsx` — lógica substituída: único `getMe()` verifica `onboardingCompleted`; removidas as 3 chamadas paralelas de listas.

### Decisões arquiteturais
- Usuários pré-existentes (sem `onboardingCompleted`) veem o onboarding mas não duplicam dados: Passos 1 e 2 detectam conta/cartão existente e oferecem "Sim, usar" antes de criar novo.
- `OnboardingFlow` perdeu as props `initialStep`/`prefilledAccountId`/`prefilledCardName` — a detecção agora é interna aos passos, simplificando a interface.

## [Fase 2 — Tarefa 2.1] Onboarding Express (Momento AHA)

**Data:** 2026-04-20

### O que foi feito
Implementação do fluxo de onboarding guiado em 3 passos: Conta Bancária → Cartão de Crédito → Cofre de Fatura. O fluxo é resiliente a interrupções e retoma do passo correto ao reabrir o app.

### Arquivos criados
- `components/onboarding/OnboardingFlow.tsx` — modal de 3 passos não-fechável; Passo 1 cria conta via `POST /accounts`; Passo 2 cria cartão via `POST /credit-cards`; Passo 3 cria cofre INVOICE via `POST /vaults` com loading mínimo de 1.5s e tela de revelação.
- `components/onboarding/OnboardingGate.tsx` — client component que dispara `Promise.all` com `getAccounts`, `getCreditCards`, `getVaults` para determinar estado do onboarding; exibe skeleton durante verificação; nunca bloqueia por erro de rede.

### Arquivos modificados
- `app/(app)/layout.tsx` — `children` envolvido em `<OnboardingGate>` para verificação on-mount.

### Decisões arquiteturais
- `OnboardingGate` separado do `OnboardingFlow` para manter layout como Server Component e isolar a lógica de verificação.
- Verificação das 3 rotas em paralelo (`Promise.all`) para minimizar latência.
- Modal sem `title` prop — elimina o botão X nativamente sem modificar `Modal.tsx`.
- `disableOverlayClose` bloqueia ESC e clique fora durante todo o fluxo.
- Passo 3 usa `Promise.allSettled` com timer de 1.5s para garantir feedback visual mínimo.

## [Fase 2 — Bloco 1] Fluxos de Autenticação Completos

**Data:** 2026-04-19

### O que foi feito
Implementação completa dos fluxos de autenticação pós-login: verificação de e-mail, recuperação de senha e banner de aviso não-bloqueante.

### Arquivos criados
- `app/(auth)/forgot-password/page.tsx` — formulário de recuperação de senha com estado de sucesso e tratamento de rate limit (429).
- `app/(auth)/reset-password/page.tsx` — formulário de redefinição de senha via token de URL; valida presença do token, igualdade e tamanho mínimo das senhas; redireciona para `/login` em 2s após sucesso.
- `app/(auth)/verify-email/page.tsx` — dispara `POST /auth/verify-email` no mount; máquina de estados `loading → success | error | no-token`; redireciona para `/login` em 2s após confirmação.
- `components/EmailVerificationBanner.tsx` — banner discreto lido do localStorage (`show_email_verification_banner`), dispensável via botão X, sem dependência de contexto global.

### Arquivos modificados
- `types/auth.ts` — adicionado `warning?: string` em `AuthResponse`.
- `app/(auth)/login/page.tsx` — verifica `auth.warning === "email_not_verified"` no sucesso e persiste flag no localStorage; adicionado link "Esqueceu sua senha?".
- `app/(app)/layout.tsx` — injetado `<EmailVerificationBanner />` acima do layout principal.

### Decisões arquiteturais
- Banner implementado como *dumb component* (sem botão de reenvio) pois o endpoint `POST /auth/resend-verification` não está disponível no backend neste ciclo.
- Email do usuário não exibido no banner pois não há contexto global de usuário (`AuthGuard` só valida o token; dados do usuário não são persistidos após login).
