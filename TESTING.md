# Como Testar o Branch de Desenvolvimento

Este guia mostra como testar a extensão a partir do branch `development`.

## 🚀 Teste Rápido (Recomendado)

```bash
# Mudar para o branch de desenvolvimento
git checkout development

# Executar teste automatizado
./test-development.sh
```

## 🔧 Teste Manual Passo a Passo

### 1. Preparação
```bash
# Verificar branch atual
git branch --show-current

# Mudar para development se necessário
git checkout development

# Verificar mudanças recentes
git log --oneline -3
```

### 2. Build e Instalação
```bash
# Compilar traduções
mkdir -p locale
for po in po/*.po; do
    lang=$(basename "$po" .po)
    mkdir -p "locale/${lang}/LC_MESSAGES"
    msgfmt "$po" -o "locale/${lang}/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo"
done

# Empacotar extensão
gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib --extra-source=locale --force

# Instalar
gnome-extensions install --force *.shell-extension.zip
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
```

### 3. Verificação Básica
```bash
# Status da extensão
gnome-extensions info auto-power-profile@andrecesarvieira.github.io

# Verificar logs em tempo real
journalctl --user -f -u gnome-shell | grep -i auto-power
```

## 🧪 Testes Específicos

### Teste de Funcionalidades

#### 1. Controle de Perfis
```bash
# Ver perfil atual
powerprofilesctl get

# Desconectar carregador (se possível) e verificar mudança automática
# Reconectar carregador e verificar mudança

# Verificar logs
journalctl --user -u gnome-shell --since "2 minutes ago" | grep -i "auto-power"
```

#### 2. Controle de Animações
```bash
# Verificar configuração atual
gsettings get org.gnome.desktop.interface enable-animations

# Abrir preferências e habilitar controle de animações
gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io

# Desconectar carregador e verificar se animações são desabilitadas
# Reconectar e verificar se são restauradas
```

#### 3. Aplicações de Performance
```bash
# Abrir preferências > Performance Apps
gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io

# Selecionar algumas aplicações (ex: Firefox, IDE)
# Abrir uma das aplicações selecionadas
# Verificar se perfil muda para performance
```

### Teste de Traduções
```bash
# Testar com idioma específico
LANG=pt_BR.UTF-8 gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io

# Outros idiomas disponíveis:
LANG=es_ES.UTF-8 gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io
LANG=fr_FR.UTF-8 gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io
```

## 🐛 Debug e Resolução de Problemas

### Logs Detalhados
```bash
# Logs em tempo real com filtro
journalctl --user -f -u gnome-shell | grep -E "(auto-power|Error|Warning)"

# Logs desde reinício da sessão
journalctl --user -u gnome-shell --since "$(systemctl --user show-environment | grep XDG_SESSION_ID | cut -d= -f2)"

# Logs específicos da extensão
journalctl --user -u gnome-shell | grep "auto-power-profile" | tail -20
```

### Verificação de Estado
```bash
# Status detalhado da extensão
gnome-extensions info auto-power-profile@andrecesarvieira.github.io

# Verificar se daemon power-profiles está rodando
systemctl --user status power-profiles-daemon

# Testar power-profiles manualmente
powerprofilesctl list
powerprofilesctl get
```

### Reinstalação Limpa
```bash
# Desabilitar e remover
gnome-extensions disable auto-power-profile@andrecesarvieira.github.io
gnome-extensions uninstall auto-power-profile@andrecesarvieira.github.io

# Limpar cache (opcional)
rm -rf ~/.cache/gnome-shell/extensions/auto-power-profile*

# Reinstalar
./test-development.sh
```

## 📊 Teste de Performance

### Verificar Impacto no Sistema
```bash
# CPU usage da extensão (deve ser mínimo)
top -p $(pgrep gnome-shell)

# Tempo de inicialização
time gnome-extensions enable auto-power-profile@andrecesarvieira.github.io

# Memória utilizada
gnome-shell --version && free -h
```

### Teste de Responsividade
```bash
# Testar mudanças rápidas de estado
for i in {1..5}; do
    powerprofilesctl set performance
    sleep 1
    powerprofilesctl set balanced  
    sleep 1
done

# Verificar logs para ver se extension acompanha mudanças
journalctl --user -u gnome-shell --since "1 minute ago" | grep -i profile
```

## 🎯 Cenários de Teste Recomendados

### Cenário 1: Usuário Normal
1. Instalar extensão
2. Configurar perfil AC = performance, Battery = balanced  
3. Habilitar controle de animações
4. Desconectar/conectar carregador várias vezes
5. Verificar se comportamento é consistente

### Cenário 2: Desenvolvedor
1. Configurar aplicação de performance (IDE, browser)
2. Abrir/fechar aplicação
3. Verificar mudanças de perfil
4. Testar com múltiplas aplicações simultaneamente

### Cenário 3: Bateria Baixa
1. Configurar threshold para 50% (para teste)
2. Simular bateria baixa (se possível)
3. Verificar se força power-saver mode

## ⚠️ Problemas Comuns

### Extensão Não Carrega
```bash
# Verificar erros de sintaxe
gnome-extensions show auto-power-profile@andrecesarvieira.github.io

# Verificar dependências
which powerprofilesctl
systemctl --user status power-profiles-daemon
```

### Preferências Não Abrem
```bash
# Testar com debug
G_MESSAGES_DEBUG=all gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io

# Verificar schemas
glib-compile-schemas schemas/
```

### Perfis Não Mudam
```bash
# Testar manualmente
powerprofilesctl set performance
powerprofilesctl get

# Verificar permissões
groups $USER | grep -E "(wheel|sudo|admin)"
```