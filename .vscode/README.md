# 🎨 VS Code Configuration — Scout Geolocations

## Overview

Configuração profissional e otimizada do VS Code para o desenvolvimento da plataforma Scout Geolocations com foco em:

- ✨ **Conforto visual** — Tema Dracula + Material Icons (reduz fadiga ocular)
- 🧹 **Code quality** — Linting, formatting, SOLID principles
- ⚡ **Produtividade** — Tasks automatizadas, debug integrado
- 📝 **Boas práticas** — EditorConfig, nomenclatura consistente
- 🔧 **All-in-one** — Extensões para .NET, Docker, Git, REST API, etc.

---

## 📁 Arquivos de Configuração

### `.vscode/extensions.json`
Lista de extensões **recomendadas** para o projeto. Ao abrir o workspace:
- VS Code exibe notificação para instalar extensões sugeridas
- Você pode aceitar tudo com um clique

**Categorias de extensões:**
- **C#/.NET** — OmniSharp, C# Dev Kit, NuGet
- **Qualidade** — SonarLint, Copilot, code analyzers
- **Formatação** — Prettier, EditorConfig
- **Containers** — Docker, Remote Containers
- **Banco de Dados** — SQL Tools, PostgreSQL
- **API Testing** — REST Client, Thunder Client
- **Git** — GitLens, Git Graph
- **Documentação** — Markdown All-in-One, Mermaid
- **UI** — Dracula Theme, Material Icons
- **Produtividade** — Bookmarks, Todo Tree, Spell Checker

### `.vscode/settings.json`
Configurações de comportamento do editor:

#### 🎨 **Tema & UI**
```json
"workbench.colorTheme": "Dracula"
"workbench.iconTheme": "material-icon-theme"
```

#### ✏️ **Editor Defaults**
```json
"editor.fontSize": 14
"editor.fontFamily": "Cascadia Code, Consolas"
"editor.formatOnSave": true
"editor.rulers": [80, 120]
```

#### 🧹 **Formatação Automática**
- Prettier para JSON, YAML, Markdown
- C# Formatter para arquivos `.cs`
- EditorConfig para consistência global

#### ⚙️ **Roslyn Analyzers** (SOLID, YAGNI, DRY, KISS)
```json
"dotnet_diagnostic.CA1822.severity": "suggestion"  // métodos estáticos
"dotnet_diagnostic.CA1000.severity": "warning"     // evitar static
```

#### 🔍 **Indice Guias & Intellisense**
- Bracket pair colorization
- Sticky scroll
- Semantic highlighting

### `.vscode/launch.json`
Configurações de **debug**:

```bash
# Debug da Identity Service
F5  # Usa preLaunchTask: "build-identity-service"
```

**Configurações incluídas:**
- Debug local (.NET Core)
- Attach ao processo
- Launch em Release mode

### `.vscode/tasks.json`
**Tasks automatizadas** para desenvolvimento rápido:

#### Build
```bash
Ctrl+Shift+B  # Build Identity Service (default)
```
Tasks: `Build`, `Clean & Build`, `Publish`

#### Database (EF Core)
```bash
"Database: Migrate"      # dotnet ef database update
"Database: Drop (Dev)"   # Limpar BD (desenvolvimento apenas)
"Database: Reset"        # Drop + Migrate
```

#### Docker
```bash
"Docker: Compose Up"     # Inicia infraestrutura
"Docker: Compose Down"   # Para serviços
"Docker: Compose Logs"   # Segue logs em tempo real
"Docker: Build Identity" # Constrói imagem
```

#### Executar
```bash
"Run: Identity Service (Debug)"   # dotnet run
"Run: Identity Service (Release)" # dotnet run -c Release
```

#### Git
```bash
"Git: Status"            # git status
"Git: Log (Last 10)"     # git log --oneline -10
```

#### Linting
```bash
"Lint: Markdown"         # markdownlint --fix **/*.md
```

---

## 📋 `.editorconfig`

Padronização **automática** de indentação, espaçamento e quebras de linha em **todos os arquivos**:

### Regras C# (SOLID Principles)

#### ✅ Nomenclatura
- `IInterface` — Interfaces começam com `I`
- `PascalCase` — Classes, métodos, propriedades
- `_camelCase` — Campos privados
- `UPPER_CASE` — Constantes

#### ✅ Estilo de Código
```csharp
// ✅ Prefira
var usuario = new Usuario();           // Type inference (YAGNI)
public string Nome => _nome;           // Expression bodies (DRY)
if (obj is Usuario usuario) { }        // Pattern matching (modern)
var resultado = valor ?? padrao;       // Null coalescing (KISS)

// ❌ Evite
Usuario usuario = new Usuario();       // Type redundância
public string Nome { get { return _nome; } }  // Verbose
if (obj is Usuario) { }                // Cast explícito
var resultado = valor == null ? padrao : valor;  // Ternário
```

#### ✅ Formatação
- Chaves em nova linha: `csharp_new_line_before_open_brace = all`
- Indentação de 4 espaços para `.cs`
- Quebras de linha automáticas em métodos encadeados

### Indentação por Tipo de Arquivo
| Tipo | Indentação |
|------|-----------|
| `.cs` / `Dockerfile` / `.sh` | 4 espaços |
| JSON, YAML, `.md`, `.csproj` | 2 espaços |
| `Makefile` | TAB |

---

## 🚀 Quick Setup

### 1️⃣ Abrir o workspace
```bash
code c:\_Meu\Repos\Scout-Geolocations
```

### 2️⃣ Instalar extensões recomendadas
VS Code exibe: `Do you want to install the recommended extensions for this workspace?`
- Clique **Install** (ou instale manualmente via Extensions panel)

### 3️⃣ Verificar configurações
```bash
Ctrl+,  # Abre Settings
```
Procure por: `Dracula` ou `prettier` para validar

### 4️⃣ Testar uma task
```bash
Ctrl+Shift+B  # Executa "Build Identity Service"
```

---

## 🎯 Princípios Implementados

### 🔷 **SOLID**
- **S**ingle Responsibility — Roslyn warnings para métodos com múltiplas responsabilidades
- **O**pen/Closed — EditorConfig força uso de interfaces (nomeação `IXxx`)
- **L**iskov — SonarLint detecta violações
- **I**nterface Segregation — Linting para interfaces menores
- **D**ependency Inversion — Sugestões de injeção de dependência

### 🔷 **YAGNI (You Aren't Gonna Need It)**
- `csharp_style_var_for_built_in_types = true` — Evite redundância de tipos
- Auto-removal de imports não utilizados
- SonarLint detecta código morto

### 🔷 **DRY (Don't Repeat Yourself)**
- Expression-bodied members (reduz verbosidade)
- Organize imports automático
- Consistent naming rules

### 🔷 **KISS (Keep It Simple, Stupid)**
- `this.` não é necessário (remover visual clutter)
- Prefira `var` quando tipo é óbvio
- Null coalescing `??` em vez de ternários

---

## 🎨 Tema Recomendado: **Dracula**

### Por que Dracula?
✅ Cores quentes e desaturadas (reduz fadiga)
✅ Contraste adequado para acessibilidade
✅ Suporte a syntax highlighting completo
✅ Popular na comunidade dev

### Alternativas
- **Nord** — Frio, minimalista, também excelente
- **One Dark Pro** — Clássico, muito usado
- **Gruvbox** — Retrô, tons terrosos

### Ativar
```bash
Ctrl+K Ctrl+T  # Selecione "Dracula"
```

---

## 🖼️ Material Icon Theme

Ícones diferenciados por tipo de arquivo:

| Arquivo | Ícone |
|---------|-------|
| `.cs` | #️⃣ C# |
| `.json` | 📋 Document |
| `.docker` | 🐳 Docker |
| `.md` | 📄 Markdown |
| `package.json` | 📦 Package |

---

## 📦 Extensões Essenciais

### Para .NET Developers
- **ms-dotnettools.csharp** — Intellisense, refactoring
- **ms-dotnettools.vscode-dotnet-runtime** — Runtime integrado
- **jchannon.csharpextensions** — Snippets e helpers

### Para Code Quality
- **sonarsource.sonarlint-vscode** — Static analysis (SOLID violations)
- **github.copilot** — IA-assisted development
- **esbenp.prettier-vscode** — Auto-formatting

### Para Docker
- **ms-azuretools.vscode-docker** — Syntax, snippets, debugging
- **ms-vscode-remote.remote-containers** — Dev containers

### Para Git
- **eamodio.gitlens** — Blame, history, authorship
- **mhutchie.git-graph** — Visualizar branch graph

---

## ⚙️ Customizar Configurações

### Editar `settings.json`
```bash
Ctrl+Shift+P  # Preferences: Open Settings (JSON)
```

### Seções principais
```json
// Editor appearance
"workbench.colorTheme": "...",
"editor.fontSize": 14,

// Auto-save
"files.autoSave": "afterDelay",

// Formatters
"[csharp]": { "editor.defaultFormatter": "..." },
"prettier.printWidth": 120
```

---

## 🔗 Useful Links

- [EditorConfig Documentation](https://editorconfig.org/)
- [Prettier Config](https://prettier.io/docs/en/options.html)
- [SonarLint Rules](https://rules.sonarsource.com/)
- [Dracula Theme](https://draculatheme.com/visual-studio-code)
- [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme)

---

## ❓ Troubleshooting

### Extensões não instaladas?
```bash
Ctrl+Shift+X  # Extensions panel
```
Procure por cada extensão em `extensions.json` e instale manualmente.

### Prettier não formata ao salvar?
```json
"[csharp]": {
  "editor.defaultFormatter": "esbenp.prettier-vscode"  // ← OK
}
```
Reinicie: `Ctrl+Shift+P > Reload Window`

### EditorConfig não aplicado?
```bash
Ctrl+Shift+P > EditorConfig: Generate .editorconfig
```
Ou instale: **EditorConfig.EditorConfig**

### Tema não carrega?
```bash
Ctrl+K Ctrl+T  # Palette de temas
# Procure "Dracula"
```

---

## 📝 Notas

- Todas as configurações estão em **control version** (`.vscode/` está committed)
- Equipe toda tem o **mesmo setup** automaticamente
- Sem "é assim na minha máquina" 🎯

**Boa sorte e código limpo!** 🚀
