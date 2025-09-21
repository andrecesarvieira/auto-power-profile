#!/bin/bash

# Build script para auto-power-profile GNOME Shell Extension
# Compila traduções e prepara extensão para distribuição

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    echo -e "${BLUE}[BUILD]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    print_header "Verificando dependências..."
    
    if ! command -v msgfmt &> /dev/null; then
        print_error "msgfmt não encontrado. Instale gettext:"
        print_error "  Fedora: sudo dnf install gettext"
        print_error "  Ubuntu: sudo apt install gettext"
        print_error "  Arch: sudo pacman -S gettext"
        exit 1
    fi
    
    if ! command -v glib-compile-schemas &> /dev/null; then
        print_error "glib-compile-schemas não encontrado. Instale glib2-devel:"
        print_error "  Fedora: sudo dnf install glib2-devel"
        print_error "  Ubuntu: sudo apt install libglib2.0-dev"
        print_error "  Arch: sudo pacman -S glib2"
        exit 1
    fi
    
    print_status "Dependências verificadas ✓"
}

# Limpar build anterior
clean_build() {
    print_header "Limpando build anterior..."
    
    # Remove locale compilado (será recriado)
    if [ -d "locale" ]; then
        rm -rf locale
        print_status "Diretório locale/ removido"
    fi
    
    # Remove schemas compilados (serão recompilados)
    if [ -f "schemas/gschemas.compiled" ]; then
        rm -f schemas/gschemas.compiled
        print_status "Schema compilado removido"
    fi
    
    # Remove arquivos .zip de extensão
    rm -f *.shell-extension.zip
    rm -f auto-power-profile@*.zip
    
    print_status "Limpeza concluída ✓"
}

# Compilar traduções
build_translations() {
    print_header "Compilando traduções..."
    
    if [ ! -d "po" ]; then
        print_warning "Diretório po/ não encontrado, pulando traduções"
        return
    fi
    
    # Criar diretório locale
    mkdir -p locale
    
    # Compilar cada arquivo .po
    local compiled_count=0
    for po_file in po/*.po; do
        if [ -f "$po_file" ]; then
            # Extrair código do idioma (pt_BR.po -> pt_BR)
            lang_code=$(basename "$po_file" .po)
            
            # Criar estrutura de diretório
            mkdir -p "locale/${lang_code}/LC_MESSAGES"
            
            # Compilar tradução
            if msgfmt "$po_file" -o "locale/${lang_code}/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo"; then
                print_status "Tradução compilada: ${lang_code}"
                ((compiled_count++))
            else
                print_error "Falha ao compilar tradução: ${lang_code}"
            fi
        fi
    done
    
    print_status "Traduções compiladas: ${compiled_count} idiomas ✓"
}

# Compilar schemas
build_schemas() {
    print_header "Compilando schemas..."
    
    if [ ! -d "schemas" ]; then
        print_warning "Diretório schemas/ não encontrado, pulando schemas"
        return
    fi
    
    cd schemas
    if glib-compile-schemas .; then
        print_status "Schemas compilados ✓"
    else
        print_error "Falha ao compilar schemas"
        cd ..
        exit 1
    fi
    cd ..
}

# Validar estrutura da extensão
validate_extension() {
    print_header "Validando estrutura da extensão..."
    
    # Arquivos obrigatórios
    required_files=("extension.js" "metadata.json" "prefs.js")
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Arquivo obrigatório não encontrado: $file"
            exit 1
        fi
    done
    
    # Validar metadata.json
    if ! python3 -m json.tool metadata.json > /dev/null 2>&1; then
        print_error "metadata.json contém JSON inválido"
        exit 1
    fi
    
    print_status "Estrutura da extensão válida ✓"
}

# Mostrar informações da extensão
show_info() {
    print_header "Informações da extensão:"
    
    if command -v jq &> /dev/null; then
        echo "  UUID: $(jq -r '.uuid' metadata.json)"
        echo "  Nome: $(jq -r '.name' metadata.json)"
        echo "  Versão: $(jq -r '.version' metadata.json)"
        echo "  GNOME Shell: $(jq -r '.["shell-version"] | join(", ")' metadata.json)"
    else
        echo "  (instale jq para ver informações detalhadas)"
        echo "  Arquivo: metadata.json"
    fi
    
    echo "  Traduções: $(find locale -name "*.mo" 2>/dev/null | wc -l) idiomas"
    echo "  Tamanho total: $(du -sh . 2>/dev/null | cut -f1)"
}

# Função principal
main() {
    print_header "Auto Power Profile - Build Script"
    echo
    
    # Verificar se estamos no diretório correto
    if [ ! -f "metadata.json" ]; then
        print_error "metadata.json não encontrado. Execute no diretório da extensão."
        exit 1
    fi
    
    # Executar passos do build
    check_dependencies
    echo
    
    clean_build
    echo
    
    build_translations
    echo
    
    build_schemas
    echo
    
    validate_extension
    echo
    
    show_info
    echo
    
    print_status "Build concluído com sucesso! 🎉"
    print_status "Para instalar: gnome-extensions install --force [arquivo.zip]"
    print_status "Para empacotar: gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib --extra-source=locale"
}

# Executar se chamado diretamente
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi