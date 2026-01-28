# FinanceFlow

Aplicação de controle financeiro pessoal desenvolvida em Electron.

## 🛠️ Tecnologias

- **Electron** - Framework para aplicações desktop
- **React** - Biblioteca para interface do usuário
- **Vite** - Build tool e dev server
- **TypeORM** - ORM para banco de dados
- **Better SQLite3** - Banco de dados local
- **Material-UI** - Biblioteca de componentes
- **Redux Toolkit** - Gerenciamento de estado
- **React Hook Form** - Gerenciamento de formulários

## 📋 Funcionalidades

- Gestão de contas bancárias
- Controle de transações (receitas e despesas)
- Categorização de gastos
- Metas financeiras
- Gestão de cartões de crédito
- Alertas e notificações
- Relatórios financeiros

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm (geralmente vem com o Node.js)

## 🚀 Configuração do Ambiente de Desenvolvimento

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd finance-flow
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Inicie o ambiente de desenvolvimento

```bash
npm run dev
```

## 🏗️ Build para Produção

### Build para Windows

```bash
npm run build:win
```

### Build para Linux

```bash
npm run build:linux
```

### Build para macOS

```bash
npm run build:mac
```

## 📁 Estrutura do Projeto

```
finance-flow/
├── src/
│   ├── main/          # Processo principal do Electron
│   ├── preload/       # Scripts de preload
│   ├── renderer/      # Interface React (processo de renderização)
│   └── shared/        # Código compartilhado
├── out/               # Arquivos compilados
├── dist/              # Executáveis gerados
└── package.json
```

## 📝 Licença

Versão: 1.0.0
