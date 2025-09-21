# Auto Power Profile

Extensão para GNOME Shell que alterna automaticamente entre perfis de energia conforme o status da fonte de alimentação e nível da bateria.

**Nova funcionalidade**: controle automático de animações do GNOME para maximizar a economia de energia na bateria.

> 🔋 **Economia de energia inteligente**: Desabilita animações automaticamente na bateria e restaura quando conectado à energia

Este projeto é um fork mantido por [andrecesarvieira](https://github.com/andrecesarvieira), baseado no trabalho original de [dmy3k](https://github.com/dmy3k/auto-power-profile).

## Compatibilidade

- GNOME Shell: 45, 46, 47, 48, 49
- Linux: Requer suporte ao `powerprofilesctl` ou `tuned-ppd` (Fedora >= 40)

## Instalação

### 🚀 Instalação Rápida (Recomendada)

**Instalação automática com um comando:**
```bash
curl -fsSL https://raw.githubusercontent.com/andrecesarvieira/auto-power-profile/main/install.sh | bash
```

**Ou baixar e executar:**
```bash
wget https://raw.githubusercontent.com/andrecesarvieira/auto-power-profile/main/install.sh
chmod +x install.sh
./install.sh
```

**Instalação manual:**
```bash
# Baixar extensão
wget https://github.com/andrecesarvieira/auto-power-profile/releases/download/v2.0.0/auto-power-profile@andrecesarvieira.github.io.shell-extension.zip

# Instalar
gnome-extensions install --force auto-power-profile@andrecesarvieira.github.io.shell-extension.zip
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
```

### ⚙️ Dependências

- **Obrigatório**: [`power-profiles-daemon`](https://gitlab.freedesktop.org/upower/power-profiles-daemon)
  ```bash
  # Fedora/RHEL
  sudo dnf install power-profiles-daemon
  
  # Ubuntu/Debian  
  sudo apt install power-profiles-daemon
  
  # Arch Linux
  sudo pacman -S power-profiles-daemon
  ```

- **Alternativa**: `tuned-ppd` (Fedora >= 40)

### 🛠️ Build Manual

```bash
# Clone o repositório
git clone https://github.com/andrecesarvieira/auto-power-profile.git
cd auto-power-profile

# Build da extensão (compila traduções, schemas e empacota)
./build.sh

# Instalar versão local
gnome-extensions install --force auto-power-profile@andrecesarvieira.github.io.shell-extension.zip
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
```

A extensão aparecerá na lista e será ativada após reiniciar a sessão.

## Como Funciona

### **Detecção de Estado de Energia**

A extensão monitora automaticamente através do UPower:

- Conexão/desconexão do carregador
- Nível da bateria em tempo real
- Estado de carregamento

### **Controle de Animações**

Quando habilitado nas configurações:

- **Na bateria**: `org.gnome.desktop.interface.enable-animations` → `false`
- **Na energia**: Restaura valor original do usuário
- **Instantâneo**: Mudança aplicada imediatamente

### **Perfis Suportados**

- **Performance**: Máximo desempenho
- **Balanced**: Equilibrio entre performance e economia
- **Power Saver**: Máxima economia de energia

## Funcionalidades

### 🔄 **Alternância Automática de Perfis**

- Perfis personalizáveis para energia (AC) e bateria
- Limite configurável para ativação do modo economia
- Modo "colo" (lap-mode) para superfícies instáveis
- Perfis específicos para aplicativos de alta performance

### 🔋 **Otimizações de Bateria**

- **Desabilitação automática de animações**: Quando na bateria, as animações do GNOME são automaticamente desabilitadas para economizar CPU/GPU
- **Restauração automática**: Animações são restauradas ao conectar à energia
- **Estado preservado**: Mantém as configurações originais do usuário

### 🚀 **Recursos da Versão 2.0.0**

- **Código Refatorado**: Arquitetura modular com separação clara de responsabilidades
- **Documentação JSDoc**: Comentários abrangentes em português em todo o código
- **Ferramentas de Desenvolvimento**: Scripts automatizados para teste e desenvolvimento
- **Melhor Tratamento de Erros**: Logging aprimorado e recovery automático
- **Performance Otimizada**: Melhor gerenciamento de recursos e memória
- **Base Sólida**: Estrutura preparada para futuras funcionalidades

## Configuração

O painel de configurações oferece duas abas:

### **Geral**

- Definir perfis padrão para energia e bateria
- Ajustar limite para economia de energia (%)
- Ativar/desativar modo "colo" (lap-mode)
- **Otimizações de bateria**: Controle de animações automático

### **Aplicativos de Performance**

- Selecionar aplicativos que ativam perfil de desempenho
- Definir perfis específicos para bateria e energia
- Listagem automática de todos os aplicativos instalados

![Janela de configurações - Geral](images/pic01.png)

![Aplicativos de Performance](images/pic02.png)

## Tradução

O projeto suporta múltiplos idiomas. Idiomas atualmente disponíveis:

- 🇧🇷 **Português Brasileiro** (pt_BR) - Completo
- 🇺🇸 **English** (en) - Padrão
- 🇪🇸 **Español** (es) - Parcial
- 🇫🇷 **Français** (fr) - Parcial

### **Contribuir com Traduções**

1. Gere o arquivo `.pot` após adicionar novas strings:

   ```bash
   xgettext \
     --from-code=UTF-8 \
     --package-name="Auto Power Profile" \
     --output="po/auto-power-profile.pot" \
     extension.js prefs.js ui/general.ui
   ```

2. Crie ou atualize arquivos `.po`:

   ```bash
   # Para novo idioma
   cp po/auto-power-profile.pot po/[codigo_idioma].po

   # Para atualizar existente
   msgmerge -U po/[codigo_idioma].po po/auto-power-profile.pot
   ```

3. Edite com [Poedit](https://poedit.net/) ou editor de texto.

4. Compile e teste:

   ```bash
   # Use o script de build (recomendado)
   ./build.sh
   
   # Ou compile manualmente
   msgfmt po/[codigo_idioma].po -o locale/[codigo_idioma]/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo
   ```

5. Reinstale a extensão para testar:

   ```bash
   # Use o script de build e instalação
   ./build.sh
   gnome-extensions install --force auto-power-profile@andrecesarvieira.github.io.shell-extension.zip
   gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
   ```

6. Envie um Pull Request.

## Resolução de Problemas

### **Extensão não carrega**

- Verifique se `power-profiles-daemon` está instalado e ativo
- Reinicie a sessão do GNOME
- Verifique logs: `journalctl --user -f -u gnome-shell`

### **Animações não desabilitam**

- Certifique-se que a opção está habilitada nas preferências
- Teste manual: `gsettings set org.gnome.desktop.interface enable-animations false`
- Desconecte e reconecte o carregador para testar

### **Perfis não alternam**

- Verifique disponibilidade: `powerprofilesctl list`
- Teste manual: `powerprofilesctl set balanced`

## Contribuição

Contribuições são bem-vindas!

### **Como Contribuir**

- 🐛 **Reportar bugs**: Abra uma [issue](https://github.com/andrecesarvieira/auto-power-profile/issues)
- 🌍 **Traduções**: Siga o guia de tradução acima
- 💡 **Novas funcionalidades**: Discuss em issues antes de implementar
- 🔧 **Correções**: Envie Pull Requests

### **Desenvolvimento**

```bash
### **Build e Contribuição**

```bash
# Clonar para contribuir
git clone https://github.com/andrecesarvieira/auto-power-profile.git
cd auto-power-profile

# Build (compila traduções, schemas e empacota)
./build.sh

# Testar localmente
gnome-extensions install --force auto-power-profile@andrecesarvieira.github.io.shell-extension.zip
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io

# Para debug: reiniciar GNOME Shell (Alt+F2, digite 'r', Enter)
```

### **Scripts Disponíveis**

- **`./install.sh`**: Instalação automática para usuários finais
- **`./build.sh`**: Compila traduções, schemas e gera pacote com UUID

## 📋 Releases

### Versão 2.0.0 (Atual)
- 🔧 **Refatoração Major**: Código completamente refatorado com documentação JSDoc
- 📝 **Documentação**: Comentários em português e arquitetura modular 
- 🛠️ **Ferramentas de Desenvolvimento**: Scripts de teste e desenvolvimento automatizados
- 🌍 **Traduções**: 6 idiomas compilados (pt_BR, es, fr, sv, tr, uk)
- ⚡ **Performance**: Melhor tratamento de erros e separação de responsabilidades
- 🎯 **Manutenibilidade**: Base sólida para futuras funcionalidades

### Versão 1.0.0  
- ✨ **Nova funcionalidade**: Controle automático de animações na bateria
- 🐛 **Corrigido**: Bug de restauração de animações ao desativar funcionalidade  
- 🔧 **Melhorado**: Resposta imediata a mudanças nas configurações
- 🌍 **Compatibilidade**: GNOME Shell 45-49
- 🧹 **Base**: Fork do auto-power-profile v24 (dmy3k) com melhorias
- 🎯 **Foco**: Economia de energia inteligente na bateria
```

## Licença

GNU General Public License v3.0 - Veja [LICENSE](LICENSE) para detalhes.

## Créditos

- **Mantedor atual**: [andrecesarvieira](https://github.com/andrecesarvieira)
- **Fork baseado em**: [dmy3k/auto-power-profile](https://github.com/dmy3k/auto-power-profile)
- **Inspirado em**: [eliapasquali/power-profile-switcher](https://github.com/eliapasquali/power-profile-switcher)
