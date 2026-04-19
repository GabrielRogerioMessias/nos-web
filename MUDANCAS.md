# Mudanças

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
