#!/bin/bash

# Script de instalação para Auto Power Profile GNOME Shell Extension
# Instalação fácil via curl para usuários finais

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
REPO_URL="https://github.com/andrecesarvieira/auto-power-profile"
EXTENSION_UUID="auto-power-profile@andrecesarvieira.github.io"
ZIP_FILENAME="${EXTENSION_UUID}.shell-extension.zip"
TEMP_DIR="/tmp/auto-power-profile-install"

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[INSTALL]${NC} $1"
}

print_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# Banner de apresentação
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              Auto Power Profile - Instalador                ║"
    echo "║                                                              ║"
    echo "║  Extensão GNOME Shell para alternância automática de        ║"
    echo "║  perfis de energia com controle de animações na bateria     ║"
    echo "║                                                              ║"
    echo "║  Mantido por: andrecesarvieira                               ║"
    echo "║  Versão: 2.0.0                                               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar dependências
check_dependencies() {
    print_header "Verificando dependências do sistema..."
    
    # Verificar GNOME Shell
    if ! command -v gnome-shell &> /dev/null; then
        print_error "GNOME Shell não encontrado. Esta extensão é apenas para GNOME."
        exit 1
    fi
    
    # Verificar gnome-extensions
    if ! command -v gnome-extensions &> /dev/null; then
        print_error "Comando gnome-extensions não encontrado."
        print_error "Instale: sudo apt install gnome-shell-extension-manager (Ubuntu/Debian)"
        print_error "        sudo dnf install gnome-extensions-app (Fedora)"
        exit 1
    fi
    
    # Verificar power-profiles-daemon
    if ! systemctl --user is-active --quiet power-profiles-daemon 2>/dev/null && 
       ! systemctl is-active --quiet power-profiles-daemon 2>/dev/null; then
        print_warning "power-profiles-daemon não está ativo"
        print_warning "Instale: sudo apt install power-profiles-daemon (Ubuntu/Debian)"
        print_warning "        sudo dnf install power-profiles-daemon (Fedora)"
        print_warning "        sudo pacman -S power-profiles-daemon (Arch)"
        echo
    fi
    
    # Verificar curl ou wget
    if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
        print_error "curl ou wget não encontrado. Instale um deles:"
        print_error "  sudo apt install curl    # Ubuntu/Debian"
        print_error "  sudo dnf install curl    # Fedora"
        print_error "  sudo pacman -S curl      # Arch"
        exit 1
    fi
    
    print_status "Dependências verificadas ✓"
}

# Baixar extensão
download_extension() {
    print_header "Baixando Auto Power Profile v2.0.0..."
    
    # Criar diretório temporário
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # URL do arquivo na release
    local download_url="${REPO_URL}/releases/download/v2.0.0/${ZIP_FILENAME}"
    
    # Baixar com curl ou wget
    if command -v curl &> /dev/null; then
        print_status "Usando curl para download..."
        if curl -L -o "$ZIP_FILENAME" "$download_url"; then
            print_status "Download concluído ✓"
        else
            print_error "Falha no download com curl"
            exit 1
        fi
    elif command -v wget &> /dev/null; then
        print_status "Usando wget para download..."
        if wget -O "$ZIP_FILENAME" "$download_url"; then
            print_status "Download concluído ✓"
        else
            print_error "Falha no download com wget"
            exit 1
        fi
    fi
    
    # Verificar se arquivo foi baixado
    if [ ! -f "$ZIP_FILENAME" ]; then
        print_error "Arquivo não encontrado após download"
        exit 1
    fi
    
    local file_size=$(du -h "$ZIP_FILENAME" | cut -f1)
    print_status "Arquivo baixado: $ZIP_FILENAME ($file_size)"
}

# Instalar extensão
install_extension() {
    print_header "Instalando extensão..."
    
    # Desinstalar versão anterior se existir
    if gnome-extensions list | grep -q "$EXTENSION_UUID"; then
        print_status "Removendo versão anterior..."
        gnome-extensions uninstall "$EXTENSION_UUID" || true
    fi
    
    # Instalar nova versão
    if gnome-extensions install --force "$ZIP_FILENAME"; then
        print_status "Extensão instalada com sucesso ✓"
    else
        print_error "Falha ao instalar extensão"
        exit 1
    fi
    
    # Habilitar extensão
    print_status "Habilitando extensão..."
    if gnome-extensions enable "$EXTENSION_UUID"; then
        print_success "Extensão habilitada ✓"
    else
        print_warning "Falha ao habilitar automaticamente. Habilite manualmente em Extensões."
    fi
}

# Verificar instalação
verify_installation() {
    print_header "Verificando instalação..."
    
    # Aguardar um momento para GNOME processar
    sleep 2
    
    # Verificar se extensão está listada
    if gnome-extensions list | grep -q "$EXTENSION_UUID"; then
        print_success "Extensão encontrada na lista ✓"
        
        # Verificar status
        local status=$(gnome-extensions info "$EXTENSION_UUID" | grep -E "(Estado|State)" | head -n1)
        print_status "Status: $status"
        
        # Verificar se está habilitada
        if gnome-extensions list --enabled | grep -q "$EXTENSION_UUID"; then
            print_success "Extensão está ATIVA ✓"
        else
            print_warning "Extensão instalada mas não está ativa"
            print_warning "Habilite manualmente em: Configurações > Extensões"
        fi
    else
        print_error "Extensão não encontrada após instalação"
        exit 1
    fi
}

# Limpeza
cleanup() {
    print_header "Limpando arquivos temporários..."
    
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        print_status "Arquivos temporários removidos ✓"
    fi
}

# Mostrar instruções finais
show_final_instructions() {
    echo
    print_success "🎉 Instalação concluída com sucesso!"
    echo
    echo -e "${CYAN}📋 Próximos passos:${NC}"
    echo "  1. Reinicie a sessão GNOME (Alt+F2, digite 'r', Enter)"
    echo "  2. Configure em: Configurações > Extensões > Auto Power Profile"
    echo "  3. Ajuste perfis para energia e bateria conforme suas preferências"
    echo
    echo -e "${CYAN}🔋 Funcionalidades principais:${NC}"
    echo "  • Alternância automática de perfis de energia"
    echo "  • Controle automático de animações na bateria" 
    echo "  • Limite configurável para modo economia"
    echo "  • Perfis específicos para aplicativos de performance"
    echo
    echo -e "${CYAN}🛠️ Suporte e documentação:${NC}"
    echo "  • GitHub: ${REPO_URL}"
    echo "  • Issues: ${REPO_URL}/issues"
    echo "  • Documentação completa no README.md"
    echo
    print_success "Aproveite a extensão! 🚀"
}

# Tratamento de erro
error_handler() {
    local line_number=$1
    print_error "Erro na linha $line_number"
    cleanup
    exit 1
}

# Tratamento de interrupção
interrupt_handler() {
    echo
    print_warning "Instalação interrompida pelo usuário"
    cleanup
    exit 1
}

# Configurar tratadores de erro
trap 'error_handler $LINENO' ERR
trap interrupt_handler SIGINT

# Função principal
main() {
    show_banner
    
    check_dependencies
    echo
    
    download_extension
    echo
    
    install_extension
    echo
    
    verify_installation
    echo
    
    cleanup
    
    show_final_instructions
}

# Executar se chamado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi