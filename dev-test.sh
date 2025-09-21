#!/bin/bash

# Script de Desenvolvimento Rápido
# Usa: ./dev-test.sh para reinstalar rapidamente durante desenvolvimento

set -e

echo "🔧 Reinstalação rápida para desenvolvimento..."

# Build básico
echo "📦 Compilando..."
mkdir -p locale > /dev/null 2>&1
for po in po/*.po; do
    [ -f "$po" ] || continue
    lang=$(basename "$po" .po)
    mkdir -p "locale/${lang}/LC_MESSAGES"
    msgfmt "$po" -o "locale/${lang}/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo" 2>/dev/null
done

# Empacotar e instalar
echo "📦 Empacotando..."
gnome-extensions pack --podir=po --extra-source=ui --extra-source=lib --extra-source=locale --force > /dev/null 2>&1

echo "🔄 Reinstalando..."
gnome-extensions install --force *.shell-extension.zip > /dev/null 2>&1
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io > /dev/null 2>&1

echo "✅ Pronto! Extensão reinstalada."
echo "💡 Para logs: journalctl --user -f -u gnome-shell | grep -i auto-power"
echo "⚙️  Para prefs: gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io"