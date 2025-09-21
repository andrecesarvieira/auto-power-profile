# Solução de Problemas - Auto Power Profile

## Problemas Comuns de Instalação

### 1. Comando curl não mostra saída

**Problema:** O comando curl executa mas não mostra nenhuma informação.

**Soluções:**

```bash
# Testar conectividade
curl -I https://raw.githubusercontent.com/andrecesarvieira/auto-power-profile/main/install.sh

# Baixar e executar localmente para debug
curl -fsSL https://raw.githubusercontent.com/andrecesarvieira/auto-power-profile/main/install.sh -o install.sh
chmod +x install.sh
./install.sh --debug

# Verificar se tem permissões
ls -la install.sh

# Executar com informações detalhadas
bash -x install.sh
```

### 2. "GNOME Shell não encontrado"

**Causa:** Não está executando em uma sessão GNOME Shell.

**Solução:**
- Faça login em uma sessão GNOME (não GNOME Classic)
- Verifique: `echo $XDG_CURRENT_DESKTOP` deve retornar "GNOME"

### 3. "Dependências faltando"

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install git gettext libglib2.0-dev gnome-shell-extension-manager power-profiles-daemon
```

**Fedora:**
```bash
sudo dnf install git gettext glib2-devel gnome-extensions-app power-profiles-daemon
```

**Arch Linux:**
```bash
sudo pacman -S git gettext glib2 gnome-shell-extensions power-profiles-daemon
```

### 4. "Versão do GNOME não suportada"

**Verificar versão:**
```bash
gnome-shell --version
```

**Versões suportadas:** 45, 46, 47, 48, 49

Se sua versão for mais antiga, atualize o sistema ou use a instalação manual.

### 5. Extensão não aparece após instalação

**Verificações:**

```bash
# Verificar se está instalada
gnome-extensions list | grep auto-power-profile

# Verificar status
gnome-extensions info auto-power-profile@andrecesarvieira.github.io

# Habilitar manualmente
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io

# Reiniciar GNOME Shell (X11 apenas)
Alt+F2 → digite 'r' → Enter
```

### 6. power-profiles-daemon não funciona

**Verificar:**
```bash
# Status do serviço
systemctl status power-profiles-daemon

# Iniciar se necessário
sudo systemctl enable --now power-profiles-daemon

# Verificar perfis disponíveis
powerprofilesctl list
```

## Instalação Manual (Alternativa)

Se o instalador automático não funcionar:

1. **Baixar código:**
   ```bash
   git clone https://github.com/andrecesarvieira/auto-power-profile.git
   cd auto-power-profile
   ```

2. **Compilar traduções:**
   ```bash
   mkdir -p locale
   for po_file in po/*.po; do
       lang=$(basename "$po_file" .po)
       mkdir -p "locale/$lang/LC_MESSAGES"
       msgfmt "$po_file" -o "locale/$lang/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo"
   done
   ```

3. **Compilar schemas:**
   ```bash
   cd schemas
   glib-compile-schemas .
   cd ..
   ```

4. **Instalar:**
   ```bash
   gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib --extra-source=locale --force
   gnome-extensions install --force auto-power-profile@andrecesarvieira.github.io.shell-extension.zip
   gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
   ```

## Informações de Debug Úteis

Antes de reportar problemas, colete essas informações:

```bash
echo "Sistema: $(uname -a)"
echo "Desktop: $XDG_CURRENT_DESKTOP"
echo "GNOME Shell: $(gnome-shell --version)"
echo "Display: $DISPLAY $WAYLAND_DISPLAY"
gnome-extensions --version
powerprofilesctl --version 2>/dev/null || echo "power-profiles-daemon não disponível"
```

## Reportar Problemas

Ao reportar problemas no GitHub:

1. Inclua as informações de debug acima
2. Descreva o comportamento esperado vs atual  
3. Inclua logs de erro completos
4. Mencione sua distribuição Linux

**Link:** https://github.com/andrecesarvieira/auto-power-profile/issues