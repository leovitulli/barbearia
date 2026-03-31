# 📖 Casos de Uso - San Patricio Barbearia

## 🎭 Cenários de Teste

### Cenário 1: Administrador - Gestão Completa

**Login como Admin**
- Email: `admin@sanpatricio.com`
- Senha: `admin123`

**Fluxo de Teste:**

1. **Dashboard**
   - Visualize as métricas do dia
   - Altere o filtro para "Este mês" e veja os dados atualizarem
   - Clique em um agendamento da tabela para gerenciar status
   - Marque um agendamento como "Concluído"

2. **Agenda**
   - Navegue para a página de Agenda
   - Clique em "Hoje" para voltar ao dia atual
   - Clique no botão "+" em um horário vazio para criar um agendamento
   - Preencha: Cliente, Barbeiro, Serviço, Data e Horário
   - Clique em um agendamento existente para editar
   - Teste o bloqueio de horário (ícone de cadeado)
   - Desbloqueie o horário bloqueado

3. **Clientes**
   - Adicione um novo cliente
   - Use a busca para encontrar um cliente específico
   - Edite as informações de um cliente
   - (Opcional) Exclua um cliente de teste

4. **Barbeiros**
   - Adicione um novo barbeiro
   - Configure as permissões dele
   - Defina uma senha
   - Edite um barbeiro existente
   - Altere o status para "Inativo"

5. **Serviços**
   - Adicione um novo serviço (ex: "Sobrancelha - R$ 25,00 - 15 min")
   - Edite um serviço existente
   - Observe os preços e durações

6. **Relatórios**
   - Configure filtros de data
   - Navegue pelas abas: Financeiro, Serviços, Cancelamentos
   - Exporte um relatório em CSV
   - Exporte um relatório em PDF
   - Filtre por barbeiro específico

7. **Logs**
   - Veja o histórico de todas as ações realizadas
   - Observe os timestamps e detalhes

8. **Configurações**
   - Edite as informações da barbearia
   - Atualize endereço e telefone
   - Configure o perfil de barbeiro do admin

---

### Cenário 2: Barbeiro com Permissões Completas

**Login como Barbeiro 1**
- Email: `barbeiro1@sanpatricio.com`
- Senha: `barber123`

**Fluxo de Teste:**

1. **Dashboard**
   - Visualize suas métricas
   - Observe que você tem acesso aos dados

2. **Agenda**
   - Veja sua agenda e de outros barbeiros
   - Crie agendamentos para você mesmo
   - Edite seus agendamentos
   - Note que NÃO pode bloquear horários (apenas admin)

3. **Clientes**
   - Acesso completo para gerenciar clientes
   - Adicione, edite e busque clientes

4. **Relatórios**
   - Acesso completo aos relatórios
   - Filtre por seu nome para ver seu desempenho
   - Exporte relatórios

5. **Perfil**
   - Veja suas estatísticas pessoais
   - Edite suas informações
   - Atualize sua foto de perfil

**Observe:**
- ❌ Não tem acesso a "Barbeiros" no menu
- ❌ Não tem acesso a "Serviços" no menu
- ❌ Não tem acesso a "Logs" no menu
- ❌ Não tem acesso a "Configurações" no menu

---

### Cenário 3: Barbeiro com Permissões Limitadas

**Login como Barbeiro 2**
- Email: `barbeiro2@sanpatricio.com`
- Senha: `barber123`

**Fluxo de Teste:**

1. **Dashboard**
   - Visualize o dashboard básico

2. **Agenda**
   - Gerencie sua agenda
   - Crie e edite agendamentos

3. **Clientes**
   - Gerencie clientes normalmente

4. **Perfil**
   - Veja suas estatísticas
   - Edite suas informações

**Observe:**
- ❌ Não tem acesso a "Relatórios" (permissão desabilitada)
- ❌ Não tem acesso a funcionalidades administrativas

---

## 🎯 Casos de Uso Específicos

### Caso 1: Criar um Agendamento Completo

1. Faça login como admin
2. Vá para "Clientes" e adicione um novo cliente:
   - Nome: "Pedro Henrique"
   - Telefone: "(11) 99999-8888"
   - Data de Nascimento: "15/03/1995"
3. Vá para "Agenda"
4. Clique no botão "+" em um horário vazio
5. Selecione:
   - Cliente: "Pedro Henrique"
   - Barbeiro: "Carlos Silva"
   - Serviço: "Corte + Barba"
   - Data: Hoje
   - Horário: "14:00"
6. Clique em "Criar"
7. Veja o agendamento aparecer na grade
8. Volte ao Dashboard e veja as métricas atualizarem

### Caso 2: Gerenciar Status de Agendamento

1. No Dashboard, encontre um agendamento "Confirmado"
2. Clique em "Concluir"
3. Observe a notificação de sucesso
4. Veja o status mudar para "Realizado" (verde)
5. Vá para "Relatórios" > "Financeiro"
6. Veja o faturamento atualizar

### Caso 3: Bloquear Horário de Almoço

1. Faça login como admin
2. Vá para "Agenda"
3. Nos horários 12:00 e 12:30, clique no ícone de cadeado
4. Digite o motivo: "Almoço"
5. Clique em "Bloquear"
6. Veja os horários ficarem bloqueados para todos os barbeiros
7. Tente criar um agendamento nesse horário (não será possível)

### Caso 4: Gerar Relatório Mensal

1. Vá para "Relatórios"
2. Configure os filtros:
   - Data Início: Primeiro dia do mês
   - Data Fim: Último dia do mês
   - Barbeiro: Todos
   - Serviço: Todos
3. Navegue pela aba "Financeiro"
4. Veja o faturamento total e por barbeiro
5. Clique em "Exportar PDF"
6. Abra o PDF gerado e veja o relatório formatado

### Caso 5: Configurar Novo Barbeiro

1. Faça login como admin
2. Vá para "Barbeiros"
3. Clique em "Novo Barbeiro"
4. Preencha:
   - Nome: "Lucas Ferreira"
   - Email: "lucas@sanpatricio.com"
   - Telefone: "(11) 98888-7777"
   - Especialidade: "Cortes infantis"
   - Status: Ativo
   - Senha: "lucas123"
5. Configure as permissões:
   - ✅ Pode visualizar relatórios
   - ✅ Pode gerenciar clientes
   - ✅ Pode gerenciar agendamentos
   - ❌ Pode visualizar todos os barbeiros
6. Clique em "Cadastrar"
7. Faça logout e teste o login com as credenciais do novo barbeiro

### Caso 6: Análise de Cancelamentos

1. Vá para "Agenda"
2. Crie alguns agendamentos de teste
3. Edite um agendamento e mude o status para "Cancelado"
4. Edite outro e mude para "Não compareceu"
5. Vá para "Relatórios" > "Cancelamentos"
6. Veja as estatísticas de cancelamentos
7. Analise os motivos e padrões
8. Exporte o relatório em CSV para análise externa

---

## 🔍 Testes de Validação

### Teste de Segurança
- [ ] Tente acessar rotas protegidas sem login (deve redirecionar para login)
- [ ] Faça login como barbeiro e tente acessar `/barbeiros` diretamente (deve mostrar erro ou redirecionar)
- [ ] Teste logout e verifique se a sessão é limpa

### Teste de Responsividade
- [ ] Abra em tela de celular (< 768px)
- [ ] Teste o menu hambúrguer
- [ ] Navegue pelas páginas
- [ ] Teste formulários em mobile
- [ ] Verifique tabelas com scroll horizontal

### Teste de Validação de Formulários
- [ ] Tente criar cliente sem preencher campos obrigatórios
- [ ] Tente criar agendamento com horário já ocupado
- [ ] Teste campos de data e hora
- [ ] Verifique máscaras de telefone

### Teste de Notificações
- [ ] Crie um cliente (deve mostrar toast de sucesso)
- [ ] Edite um serviço (deve mostrar toast de sucesso)
- [ ] Tente fazer login com credenciais erradas (deve mostrar toast de erro)
- [ ] Exclua um item (deve mostrar confirmação e toast)

---

## 📊 Dados de Teste Pré-Carregados

### Clientes (5)
- João Pedro Santos
- Lucas Oliveira
- Rafael Costa
- Marcos Almeida
- Felipe Rodrigues

### Barbeiros (3)
- Admin San Patricio
- Carlos Silva
- Roberto Mendes

### Serviços (5)
- Corte de Cabelo - R$ 50,00 - 30 min
- Barba - R$ 35,00 - 20 min
- Corte + Barba - R$ 75,00 - 45 min
- Degradê - R$ 60,00 - 40 min
- Platinado - R$ 150,00 - 120 min

### Agendamentos
- 9 agendamentos de exemplo
- Status variados (confirmado, realizado, cancelado, não compareceu)
- Distribuídos entre hoje, ontem e dias anteriores

---

## 💡 Dicas para Demonstração

1. **Comece pelo Dashboard** - Mostra visão geral e impressiona com gráficos
2. **Demonstre a Agenda** - É a funcionalidade mais visual e interativa
3. **Mostre o controle de permissões** - Faça login com diferentes usuários
4. **Exporte um relatório** - Demonstra funcionalidade profissional
5. **Teste em mobile** - Mostra responsividade
6. **Crie um agendamento do zero** - Fluxo completo

---

**Boa demonstração! 🎉**
