# 🔒 Segurança - Variáveis de Ambiente

## ⚠️ IMPORTANTE: O Que Pode Ir Pro Git?

### ✅ SEGURO para commitar

```
src/environments/environment.ts          ← brapiToken: '' (vazio)
src/environments/environment.prod.ts     ← brapiToken: '' (vazio)
.env.example                             ← Apenas exemplo
scripts/inject-env.js                    ← Script (sem tokens)
scripts/load-env.js                      ← Script (sem tokens)
vercel.json                              ← Configuração (sem tokens)
```

### ❌ NUNCA commitar

```
.env                                     ← Contém token real!
src/environments/environment.ts          ← Se tiver token preenchido
src/environments/environment.prod.ts     ← Se tiver token preenchido
```

## 🛡️ Como Funciona a Segurança

### 1. Desenvolvimento Local

```bash
# .env (NÃO vai pro Git - está no .gitignore)
BRAPI_TOKEN=fSfFxB2TPmV9pkLkHWjy31

# environment.ts (vai pro Git - VAZIO)
export const environment = {
  brapiToken: ''  // ← Vazio no Git
};
```

**Quando você roda `npm start`:**
1. Script `load-env.js` lê o `.env`
2. Gera `environment.ts` com o token
3. Angular roda com o token
4. ⚠️ **ANTES de commitar, rode `git restore src/environments/`**

### 2. Build na Vercel

```bash
# Vercel Dashboard > Environment Variables
BRAPI_TOKEN=fSfFxB2TPmV9pkLkHWjy31

# environment.prod.ts (vai pro Git - VAZIO)
export const environment = {
  brapiToken: ''  // ← Vazio no Git
};
```

**Quando Vercel faz build:**
1. Vercel define `process.env.BRAPI_TOKEN`
2. Script `inject-env.js` lê `process.env`
3. Sobrescreve `environment.prod.ts` com o token
4. Angular compila com o token
5. ✅ Token fica apenas no bundle compilado (na Vercel)

## 🔍 Verificação de Segurança

### Antes de Cada Commit

```bash
# 1. Verifique se os arquivos NÃO têm tokens
cat src/environments/environment.ts
cat src/environments/environment.prod.ts

# 2. Se tiverem tokens, limpe:
npm run env:clean  # (se adicionarmos este script)
# OU manualmente:
git restore src/environments/environment.ts
git restore src/environments/environment.prod.ts

# 3. Verifique o .env está no .gitignore
git check-ignore .env
# Deve retornar: .env ✅
```

### Auditoria no GitHub

```bash
# Procure por tokens expostos no histórico
git log -S "fSfFxB2TPmV9pkLkHWjy31" --all

# Se encontrar, é CRÍTICO rotacionar o token!
```

## 🚨 O Que Fazer Se Expor um Token

### 1. Rotacione IMEDIATAMENTE
1. Acesse [brapi.dev/dashboard](https://brapi.dev/dashboard)
2. Delete o token antigo
3. Gere um novo token

### 2. Atualize Vercel
1. Vercel Dashboard > Environment Variables
2. Edite `BRAPI_TOKEN` com o novo valor
3. Faça redeploy

### 3. Atualize .env Local
```bash
# .env
BRAPI_TOKEN=novo_token_aqui
```

### 4. Limpe Histórico (Se Necessário)
```bash
# Remove commits com tokens do histórico
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/environments/environment.prod.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CUIDADO!)
git push --force --all
```

## 📋 Checklist de Segurança

### Setup Inicial
- [ ] `.env` está no `.gitignore`
- [ ] `environment.ts` não tem token hardcoded
- [ ] `environment.prod.ts` não tem token hardcoded
- [ ] `.env.example` não tem token real
- [ ] Token configurado na Vercel Dashboard

### Antes de Cada Commit
- [ ] Rode `git diff` e verifique se não tem tokens
- [ ] `environment.ts` e `environment.prod.ts` estão vazios
- [ ] `.env` não está sendo commitado

### Deploy na Vercel
- [ ] `BRAPI_TOKEN` configurado em Environment Variables
- [ ] Build logs mostram token mascarado (`fSfFxB2T...`)
- [ ] App funciona em produção

## 🎯 Melhores Práticas

### ✅ SEMPRE
- Mantenha arquivos de environment vazios no Git
- Use `.env` para desenvolvimento local
- Use Vercel Environment Variables para produção
- Rode scripts antes de `ng serve` e build

### ❌ NUNCA
- Commite o `.env`
- Commite `environment.*.ts` com tokens
- Compartilhe tokens em mensagens, issues, etc.
- Use o mesmo token para dev e produção

## 📚 Recursos

- [OWASP - API Security](https://owasp.org/www-project-api-security/)
- [GitHub - Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Vercel - Environment Variables](https://vercel.com/docs/projects/environment-variables)
