# Auto Power Profile

Extensão para GNOME Shell que alterna automaticamente entre perfis de energia conforme o status da fonte de alimentação e nível da bateria. Inclui otimizações adicionais como desabilitação automática de animações na bateria para maximizar a economia de energia.

Este projeto é um fork mantido por [andrecesarvieira](https://github.com/andrecesarvieira), baseado no trabalho original de [dmy3k](https://github.com/dmy3k/auto-power-profile).

## Compatibilidade

- GNOME Shell: 45, 46, 47, 48
- Linux: Requer suporte ao `powerprofilesctl` ou `tuned-ppd` (Fedora >= 40)

## Instalação

### Dependências

- [`powerprofilesctl`](https://gitlab.freedesktop.org/upower/power-profiles-daemon) (presente na maioria das distros GNOME)
- Ou `tuned-ppd` (Fedora >= 40)

### Loja de Extensões GNOME

Disponível na [GNOME Extensions](https://extensions.gnome.org/extension/6583/auto-power-profile/).

### Instalação manual (desenvolvimento)

```bash
# Clone o repositório do fork
git clone https://github.com/andrecesarvieira/auto-power-profile.git
cd auto-power-profile

# Compile schemas
glib-compile-schemas schemas/

# Empacote a extensão
gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib

# Instale e ative
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

![Janela de configurações](.github/img/settings.png)

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

4. Compile para testar:

   ```bash
   msgfmt po/[codigo_idioma].po -o po/[codigo_idioma].mo
   ```

5. Envie um Pull Request.

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
# Clonar para desenvolvimento
git clone https://github.com/andrecesarvieira/auto-power-profile.git
cd auto-power-profile

# Instalar para teste
ln -sf "$PWD" ~/.local/share/gnome-shell/extensions/auto-power-profile@andrecesarvieira.github.io
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
```

## Licença

GNU General Public License v3.0 - Veja [LICENSE](LICENSE) para detalhes.

## Créditos

- **Mantedor atual**: [andrecesarvieira](https://github.com/andrecesarvieira)
- **Fork baseado em**: [dmy3k/auto-power-profile](https://github.com/dmy3k/auto-power-profile)
- **Inspirado em**: [eliapasquali/power-profile-switcher](https://github.com/eliapasquali/power-profile-switcher)
