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
    echo "║  ⚡ COMPILAÇÃO EM TEMPO REAL ⚡                              ║"
    echo "║  Mantido por: andrecesarvieira | Versão: 2.0.0              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Verificar dependências
check_dependencies() {
    print_header "Verificando dependências do sistema..."
    
    local missing_deps=()
    
    # Verificar GNOME Shell
    if ! command -v gnome-shell &> /dev/null; then
        print_error "GNOME Shell não encontrado. Esta extensão é apenas para GNOME."
        print_error "Certifique-se de estar executando em uma sessão GNOME Shell."
        exit 1
    fi
    
    # Verificar versão do GNOME Shell
    local gnome_version=$(gnome-shell --version 2>/dev/null | grep -oE '[0-9]+' | head -1)
    if [ -n "$gnome_version" ] && [ "$gnome_version" -lt 45 ]; then
        print_error "GNOME Shell $gnome_version não é suportado."
        print_error "Versões suportadas: 45, 46, 47, 48, 49"
        exit 1
    fi
    
    # Verificar gnome-extensions
    if ! command -v gnome-extensions &> /dev/null; then
        missing_deps+=("gnome-extensions")
        print_error "Comando gnome-extensions não encontrado."
        print_error "Instale: sudo apt install gnome-shell-extension-manager (Ubuntu/Debian)"
        print_error "        sudo dnf install gnome-extensions-app (Fedora)"
        print_error "        sudo pacman -S gnome-shell-extensions (Arch)"
    fi
    
    # Verificar git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
        print_error "git não encontrado. Instale:"
        print_error "  sudo apt install git     # Ubuntu/Debian"
        print_error "  sudo dnf install git     # Fedora"
        print_error "  sudo pacman -S git       # Arch"
    fi
    
    # Verificar msgfmt (gettext)
    if ! command -v msgfmt &> /dev/null; then
        missing_deps+=("gettext")
        print_error "msgfmt não encontrado. Instale gettext:"
        print_error "  sudo apt install gettext # Ubuntu/Debian"
        print_error "  sudo dnf install gettext # Fedora"
        print_error "  sudo pacman -S gettext   # Arch"
    fi
    
    # Verificar glib-compile-schemas
    if ! command -v glib-compile-schemas &> /dev/null; then
        missing_deps+=("glib2-devel")
        print_error "glib-compile-schemas não encontrado. Instale:"
        print_error "  sudo apt install libglib2.0-dev    # Ubuntu/Debian"
        print_error "  sudo dnf install glib2-devel       # Fedora"
        print_error "  sudo pacman -S glib2               # Arch"
    fi
    
    # Se houver dependências faltando, sair
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Dependências faltando: ${missing_deps[*]}"
        print_error "Instale as dependências acima e execute novamente."
        exit 1
    fi
    
    # Verificar power-profiles-daemon
    if ! systemctl --user is-active --quiet power-profiles-daemon 2>/dev/null && 
       ! systemctl is-active --quiet power-profiles-daemon 2>/dev/null; then
        print_warning "power-profiles-daemon não está ativo"
        print_warning "A extensão funcionará parcialmente sem ele."
        print_warning "Para funcionalidade completa, instale:"
        print_warning "  sudo apt install power-profiles-daemon # Ubuntu/Debian"
        print_warning "  sudo dnf install power-profiles-daemon # Fedora"
        print_warning "  sudo pacman -S power-profiles-daemon   # Arch"
        echo
        
        # Perguntar se deseja continuar
        read -p "Continuar mesmo assim? [y/N]: " continue_install
        if [[ ! "$continue_install" =~ ^[yYsS]$ ]]; then
            print_status "Instalação cancelada pelo usuário."
            exit 0
        fi
    fi
    
    print_status "Dependências verificadas ✓"
}

# Baixar código fonte e compilar
download_and_build_extension() {
    print_header "Baixando e compilando Auto Power Profile v2.0.0..."
    
    # Criar diretório temporário
    rm -rf "$TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Clonar repositório
    print_status "Clonando repositório..."
    if command -v git &> /dev/null; then
        if git clone --depth 1 --branch main "$REPO_URL.git" auto-power-profile; then
            print_status "Repositório clonado ✓"
        else
            print_error "Falha ao clonar repositório"
            exit 1
        fi
    else
        print_error "git não encontrado. Instale: sudo apt install git"
        exit 1
    fi
    
    # Entrar no diretório do projeto
    cd auto-power-profile
    
    # Compilar traduções
    print_status "Compilando traduções..."
    if [ -d "po" ]; then
        mkdir -p locale
        local compiled_count=0
        for po_file in po/*.po; do
            if [ -f "$po_file" ]; then
                lang_code=$(basename "$po_file" .po)
                mkdir -p "locale/${lang_code}/LC_MESSAGES"
                
                if msgfmt "$po_file" -o "locale/${lang_code}/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo"; then
                    ((compiled_count++))
                else
                    print_warning "Falha ao compilar tradução: ${lang_code}"
                fi
            fi
        done
        print_status "Traduções compiladas: ${compiled_count} idiomas ✓"
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
    else
        print_error "Falha ao empacotar extensão"
        exit 1
    fi
    
    # Verificar se arquivo foi criado
    if [ ! -f "$ZIP_FILENAME" ]; then
        print_error "Arquivo $ZIP_FILENAME não foi criado"
        exit 1
    fi
    
    local file_size=$(du -h "$ZIP_FILENAME" | cut -f1)
    print_status "Pacote criado: $ZIP_FILENAME ($file_size)"
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
    
    # Remover diretório temporário completo
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        print_status "Arquivos temporários removidos ✓"
    fi
    
    # Limpar cache de compilação se existir
    if [ -d ~/.cache/gnome-shell ]; then
        print_status "Limpando cache do GNOME Shell..."
        rm -rf ~/.cache/gnome-shell/extensions 2>/dev/null || true
    fi
    
    # Limpar arquivos de build desnecessários do diretório home
    find ~ -name "*.mo" -path "*/auto-power-profile*" -delete 2>/dev/null || true
    find ~ -name "gschemas.compiled" -path "*/auto-power-profile*" -delete 2>/dev/null || true
    
    print_status "Limpeza completa realizada ✓"
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
    echo -e "${CYAN}✨ Características da instalação:${NC}"
    echo "  • Compilado em tempo real com código mais recente"
    echo "  • Traduções e schemas compilados especificamente para seu sistema"
    echo "  • Arquivos desnecessários automaticamente removidos"
    echo "  • Cache limpo para garantir funcionamento otimizado"
    echo
    echo -e "${CYAN}🛠️ Suporte e documentação:${NC}"
    echo "  • GitHub: ${REPO_URL}"
    echo "  • Issues: ${REPO_URL}/issues"
    echo "  • Documentação completa no README.md"
    echo
    print_success "Aproveite a extensão compilada especialmente para você! 🚀"
}

# Tratamento de erro
error_handler() {
    local line_number=$1
    local exit_code=$?
    
    echo
    print_error "❌ Falha na instalação (linha $line_number, código $exit_code)"
    echo
    
    # Diagnóstico do ambiente
    echo -e "${CYAN}🔍 Informações de diagnóstico:${NC}"
    echo "  Sistema: $(uname -s) $(uname -m)"
    echo "  Desktop: ${XDG_CURRENT_DESKTOP:-'não detectado'}"
    echo "  Display: ${DISPLAY:-'não definido'} ${WAYLAND_DISPLAY:+'(Wayland)'}"
    
    if command -v gnome-shell &> /dev/null; then
        echo "  GNOME Shell: $(gnome-shell --version 2>/dev/null || echo 'versão não detectada')"
    else
        echo "  GNOME Shell: não instalado ❌"
    fi
    
    echo "  Bash: ${BASH_VERSION}"
    echo "  Usuário: $(whoami)"
    echo "  Diretório: $(pwd)"
    
    echo
    print_status "📞 Para suporte:"
    print_status "  • Reporte este erro: https://github.com/andrecesarvieira/auto-power-profile/issues"
    print_status "  • Inclua as informações de diagnóstico acima"
    
    cleanup
    exit $exit_code
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
    
    # Verificar ambiente de execução
    echo -e "${CYAN}🔍 Verificando ambiente de execução...${NC}"
    
    # Verificar se está em uma sessão GNOME
    if [ "${XDG_CURRENT_DESKTOP:-}" != "GNOME" ]; then
        print_warning "Desktop atual: ${XDG_CURRENT_DESKTOP:-'não detectado'}"
        print_warning "Esta extensão é projetada para GNOME Shell"
        
        if [ -z "${XDG_CURRENT_DESKTOP:-}" ]; then
            print_error "Variável XDG_CURRENT_DESKTOP não definida"
            print_error "Certifique-se de estar em uma sessão GNOME"
            exit 1
        fi
    fi
    
    # Verificar display
    if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then
        print_error "Nenhum display gráfico detectado"
        print_error "Execute este comando em uma sessão gráfica GNOME"
        exit 1
    fi
    
    print_status "Ambiente verificado ✓"
    echo
    
    check_dependencies
    echo
    
    download_and_build_extension
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
    case "${1:-}" in
        --help|-h)
            cat << 'EOF'
Auto Power Profile - Instalador v2.0.0

SINOPSE:
    curl -fsSL https://raw.githubusercontent.com/andrecesarvieira/auto-power-profile/main/install.sh | bash
    
    ou
    
    ./install.sh [OPÇÕES]

OPÇÕES:
    -h, --help      Mostra esta ajuda
    -v, --version   Mostra a versão
    --debug         Executa com informações de debug

REQUISITOS:
    - GNOME Shell 45+ em execução
    - git, gettext, glib2-devel
    - gnome-extensions
    - power-profiles-daemon (recomendado)

EXEMPLOS:
    # Instalação padrão via curl
    curl -fsSL https://raw.githubusercontent.com/andrecesarvieira/auto-power-profile/main/install.sh | bash
    
    # Instalação local com debug
    ./install.sh --debug

SUPORTE:
    https://github.com/andrecesarvieira/auto-power-profile/issues

EOF
            exit 0
            ;;
        --version|-v)
            echo "Auto Power Profile Installer v2.0.0"
            exit 0
            ;;
        --debug)
            set -x  # Ativar debug
            main "$@"
            ;;
        *)
            main "$@"
            ;;
    esac
fi