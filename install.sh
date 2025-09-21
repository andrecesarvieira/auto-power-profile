#!/bin/bash

# Auto Power Profile - Instalador v2.0.0
# Instalação simples e funcional

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configurações
REPO_URL="https://github.com/andrecesarvieira/auto-power-profile"
EXTENSION_UUID="auto-power-profile@andrecesarvieira.github.io"
ZIP_FILENAME="${EXTENSION_UUID}.shell-extension.zip"
TEMP_DIR="/tmp/auto-power-profile-install"

# Funções de output
print_header() {
    echo -e "${BLUE}[INSTALL]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              Auto Power Profile - Instalador                ║"
    echo "║                                                              ║"
    echo "║  Extensão GNOME Shell para alternância automática de        ║"
    echo "║  perfis de energia com controle de animações na bateria     ║"
    echo "║                                                              ║"
    echo "║  ⚡ INSTALAÇÃO SIMPLIFICADA ⚡                              ║"
    echo "║  Mantido por: andrecesarvieira | Versão: 2.0.0              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar dependências
check_dependencies() {
    print_header "Verificando dependências..."
    
    # Verificar GNOME Shell
    if ! command -v gnome-shell &> /dev/null; then
        print_error "GNOME Shell não encontrado. Esta extensão requer GNOME Shell."
        exit 1
    fi
    
    # Verificar gnome-extensions
    if ! command -v gnome-extensions &> /dev/null; then
        print_error "Comando gnome-extensions não encontrado."
        print_error "Instale: sudo apt install gnome-shell-extension-manager"
        exit 1
    fi
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        print_error "git não encontrado. Instale: sudo apt install git"
        exit 1
    fi
    
    # Verificar msgfmt
    if ! command -v msgfmt &> /dev/null; then
        print_error "msgfmt não encontrado. Instale: sudo apt install gettext"
        exit 1
    fi
    
    # Verificar glib-compile-schemas
    if ! command -v glib-compile-schemas &> /dev/null; then
        print_error "glib-compile-schemas não encontrado. Instale: sudo apt install libglib2.0-dev"
        exit 1
    fi
    
    print_status "Dependências verificadas ✓"
}

# Download e compilação
download_and_compile() {
    print_header "Baixando e compilando extensão..."
    
    # Limpar e criar diretório temporário
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Clonar repositório
    print_status "Clonando repositório..."
    if ! git clone --depth 1 "$REPO_URL.git" auto-power-profile; then
        print_error "Falha ao clonar repositório"
        exit 1
    fi
    
    cd auto-power-profile
    print_status "Repositório clonado ✓"
    
    # Compilar traduções
    print_status "Compilando traduções..."
    if [ -d "po" ]; then
        mkdir -p locale
        compiled_count=0
        for po_file in po/*.po; do
            if [ -f "$po_file" ]; then
                lang_code=$(basename "$po_file" .po)
                mkdir -p "locale/${lang_code}/LC_MESSAGES"
                
                if msgfmt "$po_file" -o "locale/${lang_code}/LC_MESSAGES/auto-power-profile.mo"; then
                    compiled_count=$((compiled_count + 1))
                    print_status "  $lang_code compilado ✓"
                fi
            fi
        done
        print_status "Traduções compiladas: $compiled_count idiomas ✓"
    fi
    
    # Compilar schemas
    print_status "Compilando schemas..."
    if [ -d "schemas" ]; then
        cd schemas
        if glib-compile-schemas .; then
            print_status "Schemas compilados ✓"
        else
            print_error "Falha ao compilar schemas"
            exit 1
        fi
        cd ..
    fi
    
    # Empacotar extensão
    print_status "Empacotando extensão..."
    if gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib --extra-source=locale --force; then
        print_status "Extensão empacotada ✓"
    elif gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib --force; then
        print_status "Extensão empacotada (sem locale) ✓"
    else
        print_error "Falha ao empacotar extensão"
        exit 1
    fi
    
    # Verificar arquivo
    if [ ! -f "$ZIP_FILENAME" ]; then
        print_error "Arquivo ZIP não foi criado: $ZIP_FILENAME"
        exit 1
    fi
    
    print_status "Compilação concluída ✓"
}

# Instalar extensão
install_extension() {
    print_header "Instalando extensão..."
    
    # Desinstalar versão anterior
    if gnome-extensions list | grep -q "$EXTENSION_UUID"; then
        print_status "Removendo versão anterior..."
        gnome-extensions uninstall "$EXTENSION_UUID" || true
    fi
    
    # Instalar nova versão
    if gnome-extensions install --force "$ZIP_FILENAME"; then
        print_status "Extensão instalada ✓"
    else
        print_error "Falha ao instalar extensão"
        exit 1
    fi
    
    # Habilitar extensão
    print_status "Habilitando extensão..."
    if gnome-extensions enable "$EXTENSION_UUID"; then
        print_success "Extensão habilitada ✓"
    else
        print_warning "Extensão instalada mas não habilitada automaticamente"
        print_status "Habilite manualmente em: Configurações > Extensões"
    fi
}

# Verificar instalação
verify_installation() {
    print_header "Verificando instalação..."
    
    # Verificar se arquivo foi instalado no diretório correto
    local extension_dir="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
    
    if [ -d "$extension_dir" ] && [ -f "$extension_dir/metadata.json" ]; then
        print_success "Extensão instalada no diretório ✓"
        print_status "Local: $extension_dir"
        
        # Verificar conteúdo básico
        if [ -f "$extension_dir/extension.js" ]; then
            print_success "Arquivos principais encontrados ✓"
        fi
        
        print_warning "⚠️  A extensão aparecerá na lista após reiniciar GNOME Shell"
        print_status "Para ativar imediatamente:"
        print_status "  • Alt+F2 → digite 'r' → Enter (apenas X11)"
        print_status "  • Ou faça logout/login"
        
    else
        print_error "Diretório da extensão não encontrado: $extension_dir"
        print_error "A instalação pode ter falhado"
        exit 1
    fi
}

# Limpeza
cleanup() {
    print_header "Limpando arquivos temporários..."
    rm -rf "$TEMP_DIR"
    print_status "Limpeza concluída ✓"
}

# Instruções finais
show_final_message() {
    echo
    print_success "🎉 Auto Power Profile v2.0.0 instalado com sucesso!"
    echo
    print_status "� IMPORTANTE: Reinicie GNOME Shell para ativar a extensão:"
    
    # Detectar se é Wayland ou X11
    if [ -n "${WAYLAND_DISPLAY:-}" ]; then
        print_status "  • Faça logout e login novamente (Wayland)"
    else
        print_status "  • Alt+F2 → digite 'r' → Enter (X11)"
        print_status "  • Ou faça logout e login novamente"
    fi
    
    echo
    print_status "📋 Após reiniciar:"
    print_status "  1. Abra Configurações do GNOME"
    print_status "  2. Vá em Extensões"
    print_status "  3. Habilite e configure Auto Power Profile"
    echo
    print_status "🔧 Ou configure via terminal (após reiniciar):"
    print_status "  gnome-extensions enable $EXTENSION_UUID"
    print_status "  gnome-extensions prefs $EXTENSION_UUID"
    echo
    print_success "✅ Instalação concluída! Reinicie o shell para usar."
}

# Função principal
main() {
    show_banner
    
    # Verificar ambiente
    if [ "${XDG_CURRENT_DESKTOP:-}" != "GNOME" ]; then
        print_warning "Desktop atual: ${XDG_CURRENT_DESKTOP:-'não detectado'}"
        print_warning "Esta extensão é projetada para GNOME Shell"
    fi
    
    if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then
        print_error "Nenhum display gráfico detectado"
        print_error "Execute em uma sessão gráfica GNOME"
        exit 1
    fi
    
    print_status "Ambiente verificado ✓"
    echo
    
    check_dependencies
    echo
    
    download_and_compile
    echo
    
    install_extension
    echo
    
    verify_installation
    echo
    
    cleanup
    
    show_final_message
}

# Executar
case "${1:-}" in
    --help|-h)
        echo "Auto Power Profile - Instalador v2.0.0"
        echo
        echo "USO:"
        echo "  curl -fsSL https://raw.githubusercontent.com/andrecesarvieira/auto-power-profile/main/install.sh | bash"
        echo
        echo "OPÇÕES:"
        echo "  -h, --help      Mostra esta ajuda"
        echo "  -v, --version   Mostra a versão"
        echo
        exit 0
        ;;
    --version|-v)
        echo "Auto Power Profile Installer v2.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac