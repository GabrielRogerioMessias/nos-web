# Mudanças

## [Fase 2 — Correção] Trava contra cofre duplicado no onboarding

**Data:** 2026-04-23

### O que foi feito
Corrigido o Passo 3 do onboarding com cartão para impedir múltiplos `POST /vaults` causados por re-renders/Strict Mode.

### Arquivos modificados
- `components/onboarding/OnboardingFlow.tsx` — adicionada trava com `useRef` antes da criação automática do Cofre de Fatura, liberando retry apenas em caso de falha.

## [Fase 2 — Tarefa 2.7] Configuração PWA

**Data:** 2026-04-23

### O que foi feito
Configurada a base PWA instalável com manifest nativo do App Router, metadados mobile/iOS e ícones PNG placeholder.

### Arquivos criados
- `app/manifest.ts` — manifesto PWA com `display: "standalone"`, cores dark e ícones 192/512.
- `public/icon-192x192.png` — ícone placeholder para instalação.
- `public/icon-512x512.png` — ícone placeholder para instalação.

### Arquivos modificados
- `app/layout.tsx` — adicionados `metadata`, `appleWebApp`, ícones, manifest e `viewport.themeColor`.

### Decisões arquiteturais
- Service Worker não foi adicionado nesta etapa para evitar risco de quebrar o build atual; manifest + meta tags já habilitam a base de instalabilidade.

## [Fase 2 — Tarefa 2.2] Padronização de erros em componentes

**Data:** 2026-04-22

### O que foi feito
Eliminados `catch` silenciosos em componentes e modais de formulário, substituindo falhas de API por feedback visual com Toast ou callbacks de erro já existentes.

### Arquivos criados
- `lib/api-error.ts` — helper para extrair mensagens de erro vindas da API com fallback amigável.
- `components/ui/useToastState.ts` — hook leve para reutilizar o `ToastContainer` existente em componentes sem toast próprio.

### Arquivos modificados
- `components/categories/CategoryFormModal.tsx`, `components/credit-cards/CreditCardForm.tsx`, `components/credit-cards/CreditCardList.tsx`, `components/credit-cards/InvoicePaymentModal.tsx`, `components/goals/GoalForm.tsx`, `components/goals/GoalFormModal.tsx`, `components/legal/TermsGate.tsx`, `components/onboarding/OnboardingFlow.tsx`, `components/onboarding/OnboardingGate.tsx`, `components/transactions/RecurringTransactionModal.tsx`, `components/transactions/TransactionForm.tsx`, `components/transactions/UpcomingPayments.tsx`, `components/transactions/VaultReversalModal.tsx`, `components/vaults/VaultFormModal.tsx`, `components/vaults/VaultOperationModal.tsx`.

### Decisões arquiteturais
- A lógica de negócio foi preservada; apenas tratamento de erro e feedback visual foram adicionados.
- Estados de loading/saving continuam sendo liberados em `finally` ou no próprio fluxo de erro existente.

## [Fase 2 — Ajuste UX] Leitura legal dentro do modal

**Data:** 2026-04-22

### O que foi feito
Removidos os links externos do modal de aceite obrigatório e adicionada uma área interna rolável com seções de Termos de Uso e Política de Privacidade.

### Arquivos modificados
- `components/legal/TermsGate.tsx` — substituídos links `target="_blank"` por caixa scrollável interna, mantendo checkbox obrigatório e modal bloqueante.

## [Fase 2 — Tarefa 2.5.b] Páginas legais e aceite obrigatório

**Data:** 2026-04-22

### O que foi feito
Criadas as páginas públicas de Termos de Uso e Política de Privacidade, além da trava obrigatória para usuários logados que ainda não aceitaram os termos.

### Arquivos criados
- `app/termos-de-uso/page.tsx` — página legal placeholder com botão Voltar.
- `app/politica-de-privacidade/page.tsx` — página legal placeholder com botão Voltar.
- `components/legal/LegalPlaceholderPage.tsx` — layout compartilhado das páginas legais.
- `components/legal/TermsGate.tsx` — gate fullscreen de aceite obrigatório com checkbox, links legais e POST de aceite.

### Arquivos modificados
- `app/(app)/layout.tsx` — adicionada a trava `TermsGate` no fluxo protegido, antes do onboarding.
- `lib/user.ts` — adicionada a função `acceptTerms()` para consumir `POST /auth/accept-terms`.
- `types/auth.ts` — adicionada a flag `termsAccepted` em `UserResponse`.

### Decisões arquiteturais
- O gate usa overlay fullscreen próprio sem botão de fechar, mantendo o `Modal` genérico intacto.
- Em falha de leitura do `/me`, o app não é bloqueado por erro de rede; em falha no aceite, o usuário recebe Toast de erro.

## [Fase 2 — Ajuste UX] Ações globais no cabeçalho do Perfil

**Data:** 2026-04-22

### O que foi feito
Movidas as ações frequentes de Tema e Sair para o cabeçalho do Perfil, imediatamente abaixo do e-mail do usuário, em botões ghost discretos.

### Arquivos modificados
- `app/(app)/profile/page.tsx` — adicionada linha de ações no cabeçalho com ícone Sol/Lua + "Tema" e LogOut + "Sair"; removidos Aparência e Logout da aba Avançado.

### Decisões arquiteturais
- A aba Avançado passa a concentrar apenas a Zona de Perigo/LGPD.
- A troca de tema continua usando `next-themes`, com proteção contra hydration mismatch.

## [Fase 2 — Ajuste UX] Perfil com abas minimalistas

**Data:** 2026-04-22

### O que foi feito
Refatorada a tela de Perfil para usar abas locais, reduzindo a altura visual e separando Dados Pessoais, Segurança e Avançado sem recarregar a página.

### Arquivos modificados
- `app/(app)/profile/page.tsx` — adicionado sistema de tabs, centralização com `max-w-lg mx-auto`, remoção dos cards em volta dos formulários e movimentação da Zona de Perigo para a aba Avançado.

### Decisões arquiteturais
- A lógica de API, validações, Toasts e redirecionamentos foi preservada.
- A aba Avançado concentra ações menos frequentes, incluindo Aparência, Logout e LGPD.

## [Fase 2 — Tarefa 2.3.b] Formulários vivos no Perfil

**Data:** 2026-04-22

### O que foi feito
Conectados os formulários de Dados Pessoais e Segurança na tela de Perfil, permitindo atualização de nome/e-mail e troca de senha com validação, Toasts e redirecionamento seguro após alteração de senha.

### Arquivos modificados
- `app/(app)/profile/page.tsx` — campos de perfil tornados editáveis, adicionada seção "Segurança" com troca de senha e mantida a Zona de Perigo ao final.
- `lib/user.ts` — adicionadas as funções `updateProfile()` e `changePassword()` para consumir os endpoints de autenticação.

### Decisões arquiteturais
- Estados simples por formulário (`isSavingProfile` e `isChangingPassword`), sem biblioteca externa.
- Erros de API seguem o padrão de Toast com `error.response?.data?.message`.
- A troca de senha limpa tokens/cookies e redireciona para `/login`.

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
