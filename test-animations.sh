#!/bin/bash

# Script de teste para a funcionalidade de desabilitar animações na bateria

echo "🧪 Testando funcionalidade de controle de animações na bateria"
echo "============================================================="

# Função para mostrar status atual
show_status() {
    echo "Status atual das animações: $(gsettings get org.gnome.desktop.interface enable-animations)"
}

# Verificar status inicial
echo "📊 Status inicial:"
show_status
echo ""

# Testar configuração da extensão
echo "🔧 Testando configurações da extensão:"
if gsettings get org.gnome.shell.extensions.auto-power-profile disable-animations-on-battery >/dev/null 2>&1; then
    echo "✅ Configuração 'disable-animations-on-battery' encontrada"
    echo "   Valor atual: $(gsettings get org.gnome.shell.extensions.auto-power-profile disable-animations-on-battery)"
else
    echo "❌ Configuração não encontrada. Verifique se os schemas foram compilados."
fi
echo ""

# Testar alteração manual
echo "🔧 Testando alteração manual das animações:"
echo "Desabilitando animações..."
gsettings set org.gnome.desktop.interface enable-animations false
show_status

echo "Reabilitando animações..."
gsettings set org.gnome.desktop.interface enable-animations true
show_status
echo ""

echo "✅ Teste concluído!"
echo ""
echo "📋 Para testar a extensão:"
echo "1. Ative a extensão no GNOME Extensions"
echo "2. Abra as preferências da extensão"
echo "3. Ative 'Disable animations on battery'"
echo "4. Desconecte o carregador para testar"