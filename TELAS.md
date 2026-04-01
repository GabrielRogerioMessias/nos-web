# Documentação de Telas — NOS App Financeiro

> Gerado com base no código real em `/app` e `/components`.  
> Cada seção descreve o que o usuário pode fazer na tela e as regras de negócio aplicadas no front-end.

---

## 1. Login — `/login`

### O que o usuário pode fazer
- Inserir e-mail e senha para autenticar.
- Navegar para a tela de Cadastro via link "Criar agora".
- Mostrar/ocultar a senha pelo ícone de olho.

### Regras e validações
| # | Regra |
|---|-------|
| 1 | E-mail é obrigatório e deve ter formato válido (`x@x.x`). Validado no `onBlur`. |
| 2 | Senha é obrigatória e deve ter no mínimo 8 caracteres. |
| 3 | Valores de e-mail e senha passam por `.trim()` antes da validação e envio — evita erros causados por espaço extra de teclado mobile. |
| 4 | O botão "Entrar" só fica `disabled` durante o `loading` (nunca por campos vazios) — compatibilidade com teclados mobile. |
| 5 | Se a API retornar `401` ou `403`, exibe: _"E-mail ou senha incorretos."_ O interceptor global **não** redireciona neste endpoint. |
| 6 | Qualquer outro erro de API exibe: _"Algo deu errado. Tente novamente."_ |
| 7 | Login bem-sucedido salva `accessToken` e `refreshToken` no `localStorage` e redireciona para `/`. |

---

## 2. Cadastro — `/cadastro`

### O que o usuário pode fazer
- Inserir nome, e-mail e senha para criar uma conta.
- Navegar para Login via link "Entrar".
- Mostrar/ocultar a senha pelo ícone de olho.

### Regras e validações
| # | Regra |
|---|-------|
| 1 | Nome é obrigatório (não pode ser só espaços). |
| 2 | E-mail é obrigatório e deve ter formato válido. |
| 3 | Senha é obrigatória e deve ter no mínimo 8 caracteres. |
| 4 | Todos os campos passam por `.trim()` antes do envio. |
| 5 | O botão "Criar conta" só fica `disabled` durante o `loading`. |
| 6 | Se a API retornar `409`, exibe: _"Este e-mail já está em uso."_ |
| 7 | Cadastro bem-sucedido salva tokens e redireciona para `/`. |

---

## 3. Dashboard / Início — `/`

### O que o usuário pode fazer
- Visualizar o saldo disponível total.
- Ver o resumo de valores em contas e em cofres.
- Ver as 5 transações mais recentes com link para o Extrato completo.
- Ver o desempenho financeiro dos últimos 6 meses (barras de entrada vs. saída).
- Ver o resumo de saldo de cada conta ativa.
- Abrir o formulário de Nova Transação pelo botão no cabeçalho.

### Regras e comportamentos
| # | Regra |
|---|-------|
| 1 | Todos os dados são carregados em paralelo com `Promise.all` (saldo, performance, contas, transações, perfil do usuário). |
| 2 | O saldo de cada conta é buscado via `GET /accounts/{id}/balance` em paralelo — nunca usa `initialBalance` como saldo final. |
| 3 | As 5 transações recentes são ordenadas por `transactionDate` **decrescente** (mais recente no topo) antes do `slice(0, 5)`. |
| 4 | A lista de desempenho exibe os meses em ordem **decrescente** (mês atual no topo). |
| 5 | Apenas contas com `active: true` aparecem no resumo de contas. |
| 6 | O saldo exibido no card principal fica em `text-zinc-500` (tom atenuado) quando o valor é negativo. |
| 7 | A saudação é personalizada com o primeiro nome do usuário (`"Bom dia, Gabriel"`), com skeleton enquanto carrega. |
| 8 | Se qualquer chamada da carga inicial falhar, exibe mensagem de erro centralizadae encerra o carregamento. |

---

## 4. Extrato — `/extrato`

### O que o usuário pode fazer
- Visualizar a lista paginada de todas as transações.
- Filtrar transações por: conta, tipo (Receita/Despesa/Transferência), data inicial e data final.
- Limpar todos os filtros de uma vez com o botão "Limpar filtros".
- Ver o resumo do período filtrado: Entradas, Saídas e Balanço Líquido.
- Criar uma nova transação pelo botão "+ Nova Transação".
- Editar uma transação existente (abre o SlideOver com dados preenchidos).
- Excluir uma transação com confirmação inline (botões "Sim" / "Não").
- Navegar entre páginas de resultados.

### Regras e validações
| # | Regra |
|---|-------|
| 1 | Qualquer alteração de filtro reseta a paginação para a página 0 automaticamente. |
| 2 | Filtros só enviam o parâmetro à API se tiverem valor — campos vazios são omitidos da query. |
| 3 | Transações são sempre exibidas em ordem **decrescente** por `transactionDate` (mais recente no topo), independente do que a API retorna. |
| 4 | O Balanço do período é calculado **no front-end** com base nos itens da página atual: `Entradas - Saídas`. Transferências não entram no cálculo. |
| 5 | Ao editar uma transação, o tipo (Despesa/Receita/Transferência) fica **bloqueado** — as abas ficam desabilitadas. |
| 6 | A exclusão exige confirmação inline — ao clicar em "Excluir", aparecem os botões "Sim" e "Não" na própria linha, sem modal. |
| 7 | Skeleton cobre simultaneamente o Resumo do Período e a Lista sempre que um fetch está em andamento. |

---

## 5. Nova Transação / Editar Transação (SlideOver — acessível de qualquer tela)

### O que o usuário pode fazer
- Escolher entre Despesa, Receita ou Transferência (abas).
- Preencher: descrição, valor, data (DatePicker em pt-BR), categoria e conta.
- Em Transferência: selecionar conta de origem e conta de destino.
- Salvar ou cancelar.

### Regras e validações
| # | Regra |
|---|-------|
| 1 | Descrição é obrigatória (não pode ser vazia ou só espaços). |
| 2 | Valor deve ser um número maior que zero. |
| 3 | Data é obrigatória. Preenchida automaticamente com a data de hoje na criação. |
| 4 | Categoria é obrigatória para Despesa e Receita. Para Transferência, não é exibida. |
| 5 | Conta é obrigatória para todos os tipos. |
| 6 | **Regra de saldo (Despesa):** se o valor da despesa resultar em saldo negativo na conta selecionada, o campo de valor exibe erro: _"Saldo insuficiente. Após esta despesa o saldo seria R$ X,XX em '[conta]'."_ A operação é bloqueada. |
| 7 | **Regra de saldo na edição (Despesa):** ao editar, o valor original da despesa é devolvido ao saldo antes da comparação, evitando falso positivo de insuficiência. |
| 8 | **Transferência:** conta de destino não pode ser igual à conta de origem. |
| 9 | O botão "Salvar" fica `disabled` enquanto o formulário possui erros de validação ou enquanto o `saving` está ativo. |
| 10 | Categorias são carregadas dinamicamente conforme a aba selecionada (INCOME ou EXPENSE). Ao trocar de aba na criação, a categoria é resetada. |
| 11 | Ao editar, não é possível mudar o tipo da transação (Despesa ↔ Receita ↔ Transferência). Isso significa que **não é possível converter uma Receita em Despesa se isso geraria saldo negativo** — a aba fica bloqueada e a validação de saldo usa sempre o tipo original. |

---

## 6. Gestão de Contas — `/contas`

### O que o usuário pode fazer
- Visualizar a lista de todas as contas com saldo atual, tipo e banco.
- Criar uma nova conta (SlideOver).
- Editar nome, tipo, banco e cor de uma conta existente.
- Ativar ou desativar uma conta.
- Excluir uma conta.

### Regras e validações
| # | Regra |
|---|-------|
| 1 | O saldo exibido é sempre o `currentBalance` retornado por `GET /accounts/{id}/balance`, nunca o `initialBalance` bruto. |
| 2 | Chamadas de balance são feitas em paralelo com `Promise.all` para todas as contas — sem waterfall. |
| 3 | **Desativar conta:** bloqueado se `currentBalance > 0`. Exibe: _"Não é possível inativar: transfira o saldo de R$ X,XX para outra conta primeiro."_ |
| 4 | **Excluir conta:** bloqueado se `currentBalance > 0`. Exibe a mesma mensagem de saldo. |
| 5 | **Saldo inicial:** editável apenas na criação. Na edição, o campo fica desabilitado com a mensagem: _"Para ajustar o saldo de contas ativas, crie uma transação de Ajuste."_ |
| 6 | Nome da conta é obrigatório; tipo da conta é obrigatório. |
| 7 | Conta recém-criada já aparece na lista com o `currentBalance` correto (busca `GET /accounts/{id}/balance` logo após o `POST`). |
| 8 | Contas inativas ficam com `opacity-50` na listagem para indicação visual. |

---

## 7. Gestão de Cartões de Crédito — `/cartoes`

### O que o usuário pode fazer
- Visualizar a lista de cartões cadastrados com bandeira, dias de fechamento/vencimento e limite.
- Criar um novo cartão de crédito (SlideOver).
- Editar os dados de um cartão existente.
- Excluir um cartão.

### Regras e validações
| # | Regra |
|---|-------|
| 1 | Nome do cartão é obrigatório. |
| 2 | Dia de fechamento: obrigatório, entre 1 e 31. |
| 3 | Dia de vencimento: obrigatório, entre 1 e 31. |
| 4 | **O dia de vencimento deve ser estritamente posterior ao dia de fechamento.** Se fechamento ≥ vencimento, exibe erro no campo de vencimento. |
| 5 | Bandeira (Visa, Mastercard, etc.) e Limite são opcionais. |
| 6 | Cor é selecionada por paleta de 10 opções predefinidas. |

---

## 8. Perfil — `/profile`

### O que o usuário pode fazer
- Visualizar seu nome e e-mail cadastrados.
- Ver seu avatar (imagem se disponível, iniciais caso contrário).
- Fazer logout da aplicação.

### Regras e comportamentos
| # | Regra |
|---|-------|
| 1 | Os campos de nome e e-mail são somente leitura (`disabled`) — edição de perfil não está disponível no MVP. |
| 2 | Logout limpa `accessToken` e `refreshToken` do `localStorage` e redireciona para `/login`. |
| 3 | Se o avatar (`avatarUrl`) não estiver disponível, exibe as duas primeiras iniciais do nome (ex: "Gabriel Silva" → "GS"). |
| 4 | Skeleton animado exibido enquanto os dados do usuário são carregados. |

---

## Comportamentos Globais

| # | Comportamento |
|---|---------------|
| 1 | **AuthGuard:** todas as rotas do grupo `(app)` verificam se há `accessToken` no `localStorage`. Se não houver, redireciona para `/login`. |
| 2 | **Interceptor 401/403:** para qualquer rota que **não seja** `/auth/login` ou `/auth/register`, um erro `401` ou `403` limpa os tokens e redireciona para `/login` automaticamente. |
| 3 | **Skeleton Loaders:** toda listagem exibe skeletons animados enquanto os dados estão sendo buscados. Nenhuma tela fica em branco. |
| 4 | **Toasts:** mensagens de sucesso e erro aparecem como toasts no canto inferior. Desaparecem automaticamente. |
| 5 | **SlideOvers:** formulários de criação/edição deslizam da direita no Desktop. |
| 6 | **Navegação Desktop:** Sidebar colapsada (64px) que expande para 240px no hover com transição suave. Tooltip com delay de 2s para ícones quando colapsada. |
| 7 | **Navegação Mobile:** Bottom Navigation Bar com botão central `+` para nova transação. |
| 8 | **DatePicker:** inputs de data usam componente customizado com calendário em pt-BR (react-day-picker + date-fns), sem formato nativo do browser. |
