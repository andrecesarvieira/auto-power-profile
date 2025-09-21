#!/bin/bash

# Script de Teste para Branch de Desenvolvimento
# Testa a extensão auto-power-profile no branch development

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se estamos no branch correto
check_branch() {
    local current_branch=$(git branch --show-current)
    print_header "Verificando branch atual: $current_branch"
    
    if [ "$current_branch" != "development" ]; then
        print_warning "Você não está no branch development. Mudando..."
        git checkout development
        print_status "Mudou para branch development"
    fi
}

# Build da extensão
build_extension() {
    print_header "Compilando extensão..."
    
    # Compilar traduções
    print_status "Compilando traduções..."
    mkdir -p locale
    for po in po/*.po; do
        if [ -f "$po" ]; then
            lang=$(basename "$po" .po)
            mkdir -p "locale/${lang}/LC_MESSAGES"
            msgfmt "$po" -o "locale/${lang}/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo"
            print_status "Tradução compilada: ${lang}"
        fi
    done
    
    # Compilar schemas
    print_status "Compilando schemas..."
    cd schemas && glib-compile-schemas . && cd ..
    
    # Empacotar extensão
    print_status "Empacotando extensão..."
    gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib --extra-source=locale --force
    
    print_status "Build concluído ✓"
}

# Desinstalar versão anterior
uninstall_previous() {
    print_header "Desinstalando versão anterior..."
    
    if gnome-extensions list | grep -q "auto-power-profile@andrecesarvieira.github.io"; then
        gnome-extensions disable auto-power-profile@andrecesarvieira.github.io 2>/dev/null || true
        print_status "Extensão desabilitada"
    fi
}

# Instalar nova versão
install_extension() {
    print_header "Instalando nova versão..."
    
    gnome-extensions install --force *.shell-extension.zip
    gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
    
    print_status "Extensão instalada e habilitada ✓"
}

# Testar funcionalidade básica
test_basic_functionality() {
    print_header "Testando funcionalidade básica..."
    
    # Aguardar carregamento
    sleep 2
    
    # Verificar se extensão está ativa
    if gnome-extensions info auto-power-profile@andrecesarvieira.github.io | grep -q "Estado: ACTIVE"; then
        print_status "Extensão está ativa ✓"
    else
        print_error "Extensão não está ativa"
        return 1
    fi
    
    # Verificar se não há erros críticos nos logs recentes
    if journalctl --user -u gnome-shell --since "1 minute ago" | grep -i error | grep -i auto-power; then
        print_warning "Encontrados erros nos logs (podem ser normais)"
    else
        print_status "Nenhum erro crítico encontrado nos logs ✓"
    fi
}

# Testar configurações
test_preferences() {
    print_header "Testando interface de preferências..."
    
    # Tentar abrir preferências (em background)
    timeout 5 gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io &
    PREFS_PID=$!
    
    sleep 2
    
    # Verificar se processo ainda está rodando (indica que abriu)
    if kill -0 $PREFS_PID 2>/dev/null; then
        print_status "Interface de preferências aberta ✓"
        kill $PREFS_PID 2>/dev/null || true
    else
        print_warning "Interface de preferências pode ter problemas"
    fi
}

# Testar perfis de energia
test_power_profiles() {
    print_header "Testando perfis de energia..."
    
    # Verificar se power-profiles-daemon está disponível
    if command -v powerprofilesctl &> /dev/null; then
        local current_profile=$(powerprofilesctl get)
        print_status "Perfil atual: $current_profile"
        
        # Listar perfis disponíveis
        print_status "Perfis disponíveis:"
        powerprofilesctl list | head -5
    else
        print_warning "powerprofilesctl não encontrado"
    fi
}

# Testar traduções
test_translations() {
    print_header "Testando traduções..."
    
    local locale_count=$(find locale -name "*.mo" 2>/dev/null | wc -l)
    print_status "Traduções compiladas: $locale_count idiomas"
    
    if [ $locale_count -gt 0 ]; then
        print_status "Traduções disponíveis ✓"
    else
        print_warning "Nenhuma tradução encontrada"
    fi
}

# Função principal
main() {
    echo
    print_header "=== Teste da Extensão Auto Power Profile (Development) ==="
    echo
    
    check_branch
    echo
    
    build_extension
    echo
    
    uninstall_previous
    echo
    
    install_extension
    echo
    
    test_basic_functionality
    echo
    
    test_preferences
    echo
    
    test_power_profiles
    echo
    
    test_translations
    echo
    
    print_status "=== Teste Concluído ==="
    print_status "Para debug detalhado: journalctl --user -f -u gnome-shell | grep -i auto-power"
    print_status "Para abrir preferências: gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io"
    echo
}

# Executar se chamado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi