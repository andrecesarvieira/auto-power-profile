#!/bin/bash

# Script de release para auto-power-profile
# Uso: ./scripts/release.sh [version] [description]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Verificar argumentos
if [ $# -lt 2 ]; then
    print_error "Uso: $0 <version> <description>"
    print_error "Exemplo: $0 1.0.1 'Correção de bug nas animações'"
    exit 1
fi

VERSION=$1
DESCRIPTION=$2

# Validar formato da versão (semver básico)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Versão deve estar no formato X.Y.Z (ex: 1.0.1)"
    exit 1
fi

print_status "Iniciando release v$VERSION: $DESCRIPTION"

# Verificar se estamos na branch main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "Você não está na branch main (atual: $CURRENT_BRANCH)"
    read -p "Continuar mesmo assim? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Release cancelado"
        exit 1
    fi
fi

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    print_error "Há mudanças não commitadas no repositório"
    git status --short
    exit 1
fi

# Atualizar versão no metadata.json
print_status "Atualizando versão no metadata.json"
sed -i "s/\"version\": [0-9]\+/\"version\": ${VERSION%%.*}/" metadata.json

# Verificar se CHANGELOG.md existe e tem o formato correto
if [ ! -f "CHANGELOG.md" ]; then
    print_warning "CHANGELOG.md não encontrado"
else
    print_status "Verificando CHANGELOG.md"
    if ! grep -q "## \[$VERSION\]" CHANGELOG.md; then
        print_warning "Versão $VERSION não encontrada no CHANGELOG.md"
        print_warning "Lembre-se de atualizar o changelog antes do release"
    fi
fi

# Criar commit de release
print_status "Criando commit de release"
git add metadata.json
if [ -f "CHANGELOG.md" ]; then
    git add CHANGELOG.md
fi

git commit -m "release: v$VERSION - $DESCRIPTION" || {
    print_error "Falha ao criar commit"
    exit 1
}

# Criar tag anotada
print_status "Criando tag v$VERSION"
TAG_MESSAGE="Release v$VERSION

$DESCRIPTION

$(date '+%Y-%m-%d %H:%M:%S')"

git tag -a "v$VERSION" -m "$TAG_MESSAGE" || {
    print_error "Falha ao criar tag"
    exit 1
}

# Confirmar push
print_status "Pronto para enviar:"
echo "  - Commit: $(git log -1 --oneline)"
echo "  - Tag: v$VERSION"
echo ""

read -p "Enviar para o repositório? [y/N]: " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Enviando commit e tag"
    
    git push origin main || {
        print_error "Falha ao enviar commit"
        exit 1
    }
    
    git push origin "v$VERSION" || {
        print_error "Falha ao enviar tag"
        exit 1
    }
    
    print_status "Release v$VERSION concluído com sucesso!"
    print_status "Próximos passos:"
    echo "  1. Criar release no GitHub: https://github.com/andrecesarvieira/auto-power-profile/releases/new?tag=v$VERSION"
    echo "  2. Testar instalação do release"
    echo "  3. Anunciar o release se necessário"
else
    print_warning "Release não enviado. Para enviar manualmente:"
    echo "  git push origin main"
    echo "  git push origin v$VERSION"
fi