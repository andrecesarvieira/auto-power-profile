# Solução: Traduções Não Carregando

## 🔍 **Diagnóstico Realizado:**

### ✅ **O que está correto:**

- Arquivo `.po` tem traduções corretas
- Arquivo `.mo` compilado existe
- Domínio de tradução no `.ui` está correto (`org.gnome.shell.extensions.auto-power-profile`)
- Locale do sistema é `pt_BR.UTF-8`
- Extensão está ativa

### ⚠️ **Possíveis Causas:**

1. **Cache do GNOME Shell** - Traduções podem estar em cache
2. **Localização dos arquivos** - `.mo` pode não estar no local esperado
3. **Sessão não reiniciada** - GNOME Shell precisa recarregar traduções

## 🛠️ **Soluções (em ordem de prioridade):**

### **1. 🔄 Reiniciar Sessão (MAIS PROVÁVEL)**

```bash
# Fazer logout e login novamente
# OU no terminal (se disponível):
busctl --user call org.gnome.Shell /org/gnome/Shell org.gnome.Shell Eval s 'Meta.restart("Restarting…")'
```

### **2. 🧹 Limpeza e Reinstalação**

```bash
# Desabilitar extensão
gnome-extensions disable auto-power-profile@andrecesarvieira.github.io

# Remover arquivos de cache (se existirem)
rm -rf ~/.cache/gnome-shell/extensions/auto-power-profile*

# Reabilitar
gnome-extensions enable auto-power-profile@andrecesarvieira.github.io
```

### **3. 📁 Verificar Estrutura de Diretórios**

Estrutura atual (correta):

```
~/.local/share/gnome-shell/extensions/auto-power-profile@andrecesarvieira.github.io/
├── locale/
│   └── pt_BR/
│       └── LC_MESSAGES/
│           └── org.gnome.shell.extensions.auto-power-profile.mo
├── po/
│   ├── pt_BR.po
│   └── pt_BR.mo
└── ui/
    └── general.ui (domain="org.gnome.shell.extensions.auto-power-profile")
```

### **4. 🔧 Teste Manual**

```bash
# Verificar se tradução específica existe
strings ~/.local/share/gnome-shell/extensions/auto-power-profile@andrecesarvieira.github.io/locale/pt_BR/LC_MESSAGES/org.gnome.shell.extensions.auto-power-profile.mo | grep "Otimizações de Bateria"

# Testar com LANGUAGE override
LANGUAGE=pt_BR gnome-extensions prefs auto-power-profile@andrecesarvieira.github.io
```

## 🎯 **Recomendação Principal:**

**REINICIAR A SESSÃO DO GNOME** é a solução mais provável. O GNOME Shell carrega traduções apenas na inicialização, e extensões adicionadas/modificadas durante a sessão podem não ter suas traduções carregadas até o próximo login.

## 📋 **Checklist Pós-Reinicialização:**

1. ✅ Abrir preferências da extensão
2. ✅ Verificar se "Battery Optimizations" aparece como "Otimizações de Bateria"
3. ✅ Verificar se descrição está em português
4. ✅ Testar alteração da configuração

Se após reiniciar a sessão ainda não funcionar, pode ser necessário investigar se há conflito com outras extensões ou problema específico do GNOME Shell 47/48.
