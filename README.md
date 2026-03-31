# San Patricio - Sistema de Gestão de Barbearia

Uma plataforma web completa e moderna para gerenciar barbearias, desenvolvida com React, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

### Autenticação e Controle de Acesso
- Sistema de login com email e senha
- Dois níveis de usuário: Administrador e Barbeiro
- Controle de permissões granular por barbeiro
- Sessão persistente

### Dashboard
- Visão geral com métricas chave (faturamento, agendamentos, novos clientes, ticket médio)
- Gráficos interativos de desempenho
- Gráfico de distribuição de status dos agendamentos
- Tabela de agendamentos do dia com gerenciamento rápido de status

### Agenda
- Visualização diária organizada por barbeiro e horário
- Navegação fácil entre dias
- Criação e edição de agendamentos
- Bloqueio/desbloqueio de horários (apenas admin)
- Indicadores visuais de status

### Gestão de Clientes
- CRUD completo de clientes
- Busca por nome
- Informações: nome, telefone, data de nascimento

### Gestão de Barbeiros
- CRUD completo de barbeiros
- Upload de foto de perfil
- Gerenciamento de senha
- Configuração de permissões individuais
- Status ativo/inativo

### Gestão de Serviços
- CRUD completo de serviços
- Informações: nome, preço, duração

### Relatórios
- Filtros por período, barbeiro e serviço
- Três tipos de relatórios:
  - **Financeiro**: Faturamento total e por barbeiro
  - **Serviços**: Estatísticas de popularidade
  - **Cancelamentos**: Análise de cancelamentos e não comparecimentos
- Exportação em CSV e PDF

### Logs do Sistema
- Registro de todas as ações importantes
- Apenas visível para administradores
- Timestamp, usuário, ação e detalhes

### Perfil e Configurações
- **Barbeiros**: Editar informações pessoais e visualizar estatísticas
- **Administradores**: Configurar dados da barbearia e ativar perfil de barbeiro

## 🛠️ Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **React Router DOM** - Roteamento
- **Zustand** - Gerenciamento de estado
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos
- **date-fns** - Manipulação de datas
- **Sonner** - Notificações toast
- **Lucide React** - Ícones
- **jsPDF** - Exportação PDF
- **PapaParse** - Exportação CSV

## 📦 Instalação

1. Clone o repositório ou navegue até a pasta do projeto:
```bash
cd /Users/leovitulli/Barbearia
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra o navegador em `http://localhost:5173`

## 🔑 Credenciais de Teste

### Administrador
- **Email**: admin@sanpatricio.com
- **Senha**: admin123
- **Permissões**: Acesso total ao sistema

### Barbeiro
- **Email**: barbeiro1@sanpatricio.com
- **Senha**: barber123
- **Permissões**: Pode visualizar relatórios e gerenciar clientes

### Barbeiro (Permissões Limitadas)
- **Email**: barbeiro2@sanpatricio.com
- **Senha**: barber123
- **Permissões**: Não pode visualizar relatórios

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes UI reutilizáveis
│   └── Layout.tsx       # Layout principal com sidebar
├── pages/               # Páginas da aplicação
│   ├── LoginPage.tsx
│   ├── Dashboard.tsx
│   ├── Agenda.tsx
│   ├── Clients.tsx
│   ├── Barbers.tsx
│   ├── Services.tsx
│   ├── Reports.tsx
│   ├── Logs.tsx
│   ├── Profile.tsx
│   └── Settings.tsx
├── store/
│   └── authStore.ts     # Store de autenticação (Zustand)
├── data/
│   └── mockData.ts      # Dados mock em memória
├── types/
│   └── index.ts         # Definições de tipos TypeScript
├── lib/
│   └── utils.ts         # Funções utilitárias
├── App.tsx              # Componente raiz com rotas
├── main.tsx             # Entry point
└── index.css            # Estilos globais

```

## 🎨 Design

- Interface moderna e responsiva
- Paleta de cores profissional
- Componentes consistentes baseados em shadcn/ui
- Ícones claros e intuitivos da biblioteca Lucide
- Feedback visual com notificações toast
- Gráficos interativos e visualmente atraentes

## 🔐 Controle de Permissões

O sistema implementa controle de acesso baseado em roles e permissões:

- **Administradores**: Acesso total
- **Barbeiros**: Acesso configurável por permissão:
  - `canViewReports`: Visualizar relatórios
  - `canManageClients`: Gerenciar clientes
  - `canManageAppointments`: Gerenciar agendamentos
  - `canViewAllBarbers`: Visualizar todos os barbeiros

## 📊 Dados Mock

A aplicação utiliza dados simulados em memória para demonstração. Em produção, estes seriam substituídos por chamadas a uma API REST ou GraphQL.

Os dados incluem:
- 3 usuários (1 admin, 2 barbeiros)
- 5 clientes
- 5 serviços
- 9 agendamentos de exemplo
- Logs do sistema

## 🚀 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter

## 🔄 Próximos Passos (Produção)

Para usar em produção, seria necessário:

1. **Backend API**
   - Implementar API REST ou GraphQL
   - Banco de dados (PostgreSQL, MySQL, MongoDB)
   - Autenticação JWT
   - Upload de imagens para cloud storage

2. **Funcionalidades Adicionais**
   - Sistema de notificações (email/SMS)
   - Agendamento online para clientes
   - Sistema de avaliações
   - Integração com pagamentos
   - Relatórios mais avançados
   - Backup automático

3. **Deploy**
   - Frontend: Vercel, Netlify, ou AWS S3 + CloudFront
   - Backend: AWS, Google Cloud, ou DigitalOcean
   - CI/CD com GitHub Actions

## 📄 Licença

Este projeto foi desenvolvido para fins de demonstração.

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ para San Patricio Barbearia
