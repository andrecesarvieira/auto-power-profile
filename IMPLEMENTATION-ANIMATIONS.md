# Implementação: Desabilitar Animações GNOME na Bateria

## 🎯 Funcionalidade Implementada

A extensão Auto Power Profile agora inclui uma nova funcionalidade que **desabilita automaticamente as animações do GNOME quando estiver na bateria** e as **restaura automaticamente quando conectar à energia**.

## 📋 Arquivos Modificados

### 1. **Schema de Configurações** (`schemas/org.gnome.shell.extensions.auto-power-profile.gschema.xml`)

- ✅ Adicionada nova chave `disable-animations-on-battery` (tipo boolean, padrão: false)
- ✅ Schema recompilado com `glib-compile-schemas`

### 2. **Interface de Preferências** (`ui/general.ui`)

- ✅ Adicionado novo grupo "Battery Optimizations"
- ✅ Incluído `AdwSwitchRow` para controlar a funcionalidade
- ✅ Interface intuitiva com descrição clara

### 3. **Código de Preferências** (`prefs.js`)

- ✅ Adicionado `disable_animations_on_battery` aos InternalChildren
- ✅ Configurado binding automático com as configurações

### 4. **Lógica Principal** (`extension.js`)

- ✅ Adicionadas propriedades para controle de estado:

  - `_interfaceSettings`: Acesso ao schema org.gnome.desktop.interface
  - `_originalAnimationsEnabled`: Preserva estado original
  - `_animationsCurrentlyDisabled`: Controle de estado atual

- ✅ Implementados métodos principais:
  - `_manageAnimationsBasedOnPower()`: Lógica principal de controle
  - `_disableAnimations()`: Desabilita animações preservando estado
  - `_enableAnimations()`: Restaura estado original
- ✅ Integração com sistema existente:
  - Chamada automática em `_checkProfile()`
  - Tratamento em `_onSettingsChange()`
  - Cleanup em `disable()`

## 🔄 Como Funciona

### **Estado na Bateria** 🔋

1. UPower detecta que está na bateria
2. `_checkProfile()` é chamado automaticamente
3. `_manageAnimationsBasedOnPower()` verifica configuração
4. Se ativada, `_disableAnimations()` desabilita animações
5. Estado original é preservado

### **Estado na Energia** ⚡

1. UPower detecta conexão com AC
2. `_checkProfile()` é chamado automaticamente
3. `_manageAnimationsBasedOnPower()` verifica estado
4. `_enableAnimations()` restaura estado original
5. Animações voltam como estavam antes

### **Proteções Implementadas** 🛡️

- ✅ Preserva preferência original do usuário
- ✅ Restaura estado ao desativar extensão
- ✅ Restaura estado ao desativar funcionalidade
- ✅ Verificações de estado para evitar operações desnecessárias
- ✅ Logs informativos para debugging

## 🧪 Testando a Funcionalidade

### **Método Manual:**

```bash
# Executar script de teste
./test-animations.sh
```

### **Método Prático:**

1. **Ativar extensão** no GNOME Extensions
2. **Abrir preferências** da extensão
3. **Ativar** "Disable animations on battery"
4. **Desconectar carregador** → Animações desabilitadas
5. **Conectar carregador** → Animações restauradas

## ⚡ Benefícios

- **🔋 Economia de Energia**: Animações consomem CPU/GPU
- **🚀 Performance**: Interface mais responsiva na bateria
- **🔄 Automático**: Sem intervenção manual necessária
- **🛡️ Seguro**: Sempre restaura estado original
- **⚙️ Configurável**: Usuário controla ativação

## 📊 Configuração GSetting Utilizada

- **Schema**: `org.gnome.desktop.interface`
- **Chave**: `enable-animations`
- **Tipo**: boolean
- **Escopo**: Global (afeta todo o GNOME Shell)

## 🎉 Status da Implementação

**✅ IMPLEMENTAÇÃO COMPLETA E FUNCIONAL**

A funcionalidade está totalmente implementada e integrada ao sistema existente da extensão. Todas as proteções e casos edge foram considerados, garantindo um comportamento robusto e confiável.
