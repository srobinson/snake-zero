# Contributing to Snake Zero

## 🔍 Pre-Change Checklist

Before making any changes:
- [ ] Read and understand `system.prompt`
- [ ] Review `requirements.md`
- [ ] Check current `README.md`
- [ ] Identify all files that will be affected

## 📝 Change Process

### 1. Documentation First
- [ ] Document the intended changes
- [ ] List which files will need updates
- [ ] Note any new configuration options being added
- [ ] Identify impact on existing features

### 2. Implementation
- [ ] Make code changes
- [ ] Add/update configuration options in `gameConfig.js`
- [ ] Update type definitions if applicable
- [ ] Add necessary validation

### 3. Documentation Updates
- [ ] Update README.md with:
  - [ ] New features
  - [ ] Changed configurations
  - [ ] Updated examples
  - [ ] Modified behaviors
- [ ] Update inline code documentation
- [ ] Update any affected configuration examples

### 4. Verification
- [ ] Confirm all changes are documented
- [ ] Verify README.md is accurate and complete
- [ ] Check all configuration examples work
- [ ] Ensure no documentation is outdated

## 🚀 Change Types Requiring Documentation

### Configuration Changes
- [ ] New configuration options
- [ ] Modified default values
- [ ] Changed behavior of existing options
- [ ] Deprecated options

### Feature Changes
- [ ] New features
- [ ] Modified features
- [ ] Removed features
- [ ] Changed behavior

### API Changes
- [ ] New methods
- [ ] Modified parameters
- [ ] Changed return values
- [ ] Deprecated functionality

### Visual Changes
- [ ] New visual elements
- [ ] Modified appearance
- [ ] Changed animations
- [ ] Updated themes

## ✅ Final Checklist

Before completing changes:
- [ ] All new features documented in README.md
- [ ] All modified configurations documented
- [ ] Examples are up to date
- [ ] No outdated documentation remains
- [ ] All changes follow project requirements
- [ ] Documentation matches implemented behavior

## 🔄 Process Automation

To help enforce this process:
1. Use this file as a literal checklist for changes
2. Review the checklist before marking work as complete
3. Include documentation updates in the same commit/PR
4. Never separate code changes from their documentation

## 🎯 Documentation Principles

1. **Completeness**
   - Document all features
   - Include all configuration options
   - Provide working examples
   - Explain all behaviors

2. **Accuracy**
   - Keep documentation in sync with code
   - Update examples when behavior changes
   - Remove outdated information
   - Verify all examples work

3. **Clarity**
   - Use clear, concise language
   - Provide context for changes
   - Explain why changes were made
   - Include relevant examples

4. **Maintainability**
   - Keep documentation close to code
   - Use consistent formatting
   - Follow existing patterns
   - Make documentation easy to update

## 📋 Pull Request Template

```markdown
## Changes Made
- [ ] Code changes
- [ ] Configuration updates
- [ ] Documentation updates
- [ ] Example updates

## Documentation Updates
- [ ] README.md updated
- [ ] Configuration examples updated
- [ ] Inline documentation added/updated
- [ ] Examples verified working

## Verification
- [ ] All changes documented
- [ ] No outdated documentation
- [ ] All examples work
- [ ] Documentation matches behavior
```
