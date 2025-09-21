# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [23] - 2025-09-21

### ✨ Adicionado
- **Controle automático de animações na bateria**: Nova funcionalidade que desabilita automaticamente as animações do GNOME quando usando a bateria para economizar energia
- **Restauração automática**: Animações são automaticamente restauradas ao conectar à energia
- **Interface de configuração**: Nova seção "Otimizações de Bateria" nas preferências
- **Script de instalação**: `install.sh` para instalação direta do GitHub
- **Script de build**: Processo automatizado de compilação
- **Traduções completas**: Suporte completo ao português brasileiro para nova funcionalidade

### 🐛 Corrigido
- **Detecção de estado de energia**: Corrigida lógica para detectar corretamente estados `CHARGING`, `FULLY_CHARGED` e `PENDING_CHARGE`
- **Preservação de configurações**: A extensão agora preserva as configurações originais do usuário ao desabilitar

### 🔄 Melhorado
- **Documentação**: README.md completamente reescrito com seções detalhadas
- **Processo de build**: Sistema de build automatizado com compilação de schemas e traduções
- **Estrutura do projeto**: Limpeza de arquivos desnecessários e organização melhorada
- **Compatibilidade**: Testado com GNOME Shell 48.4

### 🗑️ Removido
- Arquivos de desenvolvimento e debug desnecessários
- Logs de debug da versão de produção

## [22] - 2025-08-19

### 📋 Versão base do fork
- Fork do projeto original de dmy3k
- Funcionalidades básicas de alternância de perfis de energia
- Suporte a aplicativos de performance
- Traduções parciais

---

**Formato baseado em [Keep a Changelog](https://keepachangelog.com/)**