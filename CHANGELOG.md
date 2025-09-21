# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-09-21

### Adicionado
- **Controle automático de animações**: Nova funcionalidade que desabilita automaticamente as animações do GNOME quando executando na bateria para economizar energia
- **Otimizações de bateria**: Seção dedicada nas preferências para controles de economia de energia
- **Restauração inteligente**: Animações são automaticamente restauradas ao conectar na energia ou desabilitar a funcionalidade
- **Resposta em tempo real**: Mudanças nas configurações são aplicadas imediatamente
- **Sistema de versionamento independente**: Estabelecimento de versionamento próprio do fork
- **Localização completa pt_BR**: Tradução completa para português brasileiro

### Corrigido
- **Bug de restauração**: Corrigido problema onde animações não eram restauradas ao desativar a funcionalidade
- **Limpeza de estado**: Garantia de limpeza adequada das configurações ao desabilitar a extensão

### Alterado
- **Metadados independentes**: UUID e URLs atualizados para refletir o fork independente
- **Documentação**: README.md completamente reescrito com foco nas novas funcionalidades
- **Compatibilidade**: Suporte confirmado para GNOME Shell 45-49

### Base Técnica
- Fork baseado no auto-power-profile v24 (dmy3k/auto-power-profile)
- Mantém compatibilidade com funcionalidades originais
- Adiciona camada de otimizações de energia específicas

---

## Esquema de Versionamento

Este projeto segue [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis na API ou funcionalidade
- **MINOR** (1.X.0): Adição de funcionalidades mantendo compatibilidade
- **PATCH** (1.0.X): Correções de bugs e melhorias menores

### Próximas Versões Planejadas

- **1.1.0**: Melhorias na interface e novas otimizações de bateria
- **1.2.0**: Suporte a perfis personalizados por aplicativo
- **2.0.0**: Reescrita da arquitetura com breaking changes (futuro)