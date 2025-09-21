# Workflow de Desenvolvimento - Auto Power Profile

Este projeto usa uma estratégia de branching para manter estabilidade na produção enquanto permite desenvolvimento contínuo.

## Estrutura de Branches

### `main` - Branch de Produção
- **Propósito**: Versões estáveis e testadas
- **Proteção**: Apenas código testado e funcional
- **Releases**: Todas as releases oficiais são feitas a partir desta branch
- **Merges**: Apenas de `development` após testes completos

### `development` - Branch de Desenvolvimento
- **Propósito**: Desenvolvimento ativo e novas funcionalidades
- **Código**: Pode conter funcionalidades experimentais
- **Testes**: Ambiente de teste e validação
- **Refatorações**: Local para melhorias de código e documentação

### `upstream/main` - Upstream Original
- **Propósito**: Referência ao projeto original (dmy3k/auto-power-profile)
- **Uso**: Para acompanhar mudanças do projeto upstream
- **Sincronização**: Ocasional para incorporar correções importantes

## Workflow de Desenvolvimento

### 1. Trabalhando em Novas Funcionalidades

```bash
# Mudar para development
git checkout development

# Atualizar com últimas mudanças
git pull origin development

# Trabalhar e fazer commits
git add .
git commit -m "feat: nova funcionalidade X"

# Enviar para repositório
git push origin development
```

### 2. Criando uma Release

```bash
# Garantir que development está testado e funcionando
./build.sh
# Testar extensão...

# Mudar para main
git checkout main

# Fazer merge do development
git merge development

# Usar script de release
./scripts/release.sh 1.1.0 "Descrição da versão"

# Ou processo manual:
# git tag -a v1.1.0 -m "Release v1.1.0"
# git push origin main
# git push origin v1.1.0
```

### 3. Hotfixes Urgentes

```bash
# Para correções críticas na main
git checkout main
git checkout -b hotfix/fix-critical-bug

# Fazer correção
git commit -m "fix: correção crítica"

# Merge na main
git checkout main
git merge hotfix/fix-critical-bug

# Merge no development também
git checkout development
git merge hotfix/fix-critical-bug

# Limpar branch temporária
git branch -d hotfix/fix-critical-bug
```

## Estado Atual

### Branch `main` (Produção)
- **Versão atual**: v1.0.0
- **Status**: Estável e funcional
- **Funcionalidades**:
  - ✅ Controle automático de perfis de energia
  - ✅ Controle de animações na bateria
  - ✅ Suporte a aplicações de performance
  - ✅ Sistema de traduções funcionais
  - ✅ Script de build automatizado

### Branch `development` (Desenvolvimento)  
- **Versão**: v1.1.0-dev
- **Status**: Em desenvolvimento
- **Melhorias recentes**:
  - ✅ Refatoração completa do código com JSDoc
  - ✅ Melhor organização de métodos
  - ✅ Tratamento de erros aprimorado
  - ✅ Logging estruturado para debug
  - ✅ Documentação interna detalhada

## Comandos Úteis

```bash
# Ver diferenças entre branches
git diff main..development

# Ver commits apenas no development
git log main..development --oneline

# Verificar branch atual
git branch --show-current

# Listar todas as branches
git branch -a

# Alternar entre branches
git checkout main        # Para produção
git checkout development # Para desenvolvimento
```

## Regras de Desenvolvimento

### ✅ Permitido no `development`
- Refatorações e melhorias de código
- Novas funcionalidades experimentais
- Mudanças na documentação
- Testes e validações
- Correções de bugs não-críticos

### ❌ Evitar no `development`
- Commits que quebram funcionalidades básicas
- Mudanças que impedem build/instalação
- Código não documentado ou sem comentários
- Alterações que removem funcionalidades existentes

### ✅ Permitido no `main`
- Merges testados do development
- Hotfixes críticos bem testados
- Atualizações de documentação de usuário
- Releases e tags de versão

### ❌ Proibido no `main`
- Desenvolvimento direto de funcionalidades
- Commits experimentais ou não testados
- Mudanças que quebram compatibilidade
- Código sem testes adequados

## Versionamento

- **Major** (2.0.0): Mudanças incompatíveis
- **Minor** (1.1.0): Novas funcionalidades compatíveis  
- **Patch** (1.0.1): Correções de bugs

Desenvolvimento usa sufixo `-dev` (ex: v1.1.0-dev).