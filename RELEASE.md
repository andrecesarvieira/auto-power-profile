# Release Guidelines

Este documento descreve o processo de criação de releases para o projeto auto-power-profile.

## Processo de Release

### 1. Preparação
- [ ] Atualizar version em `metadata.json`
- [ ] Atualizar `CHANGELOG.md` com as mudanças
- [ ] Atualizar `README.md` se necessário
- [ ] Executar testes básicos da extensão

### 2. Commit e Tag
```bash
# Commit das mudanças
git add -A
git commit -m "release: v[VERSION] - [DESCRIPTION]"

# Criar tag anotada
git tag -a v[VERSION] -m "Release v[VERSION]

[RELEASE NOTES]"

# Push para o repositório
git push origin main
git push origin v[VERSION]
```

### 3. GitHub Release
- Criar release no GitHub usando a tag
- Incluir changelog da versão
- Anexar arquivo .zip se necessário

### 4. Validação
- [ ] Verificar instalação via git clone
- [ ] Testar funcionalidades principais
- [ ] Confirmar traduções

## Versionamento

### Tipos de Mudança
- **Major (X.0.0)**: Breaking changes, nova arquitetura
- **Minor (1.X.0)**: Novas funcionalidades, melhorias
- **Patch (1.0.X)**: Correções de bugs, ajustes menores

### Exemplos
- `1.0.1`: Correção de bug nas animações
- `1.1.0`: Nova funcionalidade de suspensão automática
- `2.0.0`: Reescrita completa da extensão

## Checklist de Release

### Pre-Release
- [ ] Código testado e funcionando
- [ ] Documentação atualizada
- [ ] Traduções verificadas
- [ ] Changelog atualizado
- [ ] Versão atualizada em metadata.json

### Release
- [ ] Tag criada e enviada
- [ ] Release no GitHub publicado
- [ ] Changelog no GitHub atualizado

### Post-Release
- [ ] Instalação testada do release
- [ ] Funcionalidades validadas
- [ ] Documentação verificada

## Comandos Úteis

```bash
# Ver última tag
git describe --tags --abbrev=0

# Ver mudanças desde última tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Criar release automaticamente (futuro)
./scripts/release.sh [version]
```