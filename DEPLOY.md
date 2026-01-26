# Deploy na Vercel

Este guia mostra como fazer deploy do simulador de ETFs na Vercel.

## Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Token da API brapi.dev ([obtenha aqui](https://brapi.dev/dashboard))
3. Repositório no GitHub

## Configuração

### 1. Importe o Projeto na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Conecte sua conta do GitHub
3. Selecione o repositório `gabireze/etfs-app`
4. Clique em **Import**

### 2. Configure a Variável de Ambiente

Durante a importação ou depois em **Project Settings**:

1. Vá em **Environment Variables**
2. Adicione uma nova variável:
   - **Name:** `BRAPI_TOKEN`
   - **Value:** Seu token da brapi.dev (ex: `fSfFxB2TPmV9pkLkHWjy31`)
   - **Environments:** Marque `Production`, `Preview`, e `Development`

![Vercel Environment Variables](https://vercel.com/_next/image?url=%2Fdocs-proxy%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fenvironment-variables%2Fenv-vars.png&w=3840&q=75)

3. Clique em **Save**

### 3. Configure o Build

O projeto já está configurado com `vercel.json`. A Vercel vai:

1. Executar `node scripts/inject-env.js` - injeta o token em `environment.prod.ts`
2. Executar `npm run build` - compila o projeto Angular
3. Publicar o conteúdo de `dist/etfs-app/browser`

### 4. Deploy

1. Clique em **Deploy**
2. Aguarde o build terminar (~2-3 minutos)
3. Acesse a URL gerada (ex: `https://etfs-app.vercel.app`)

## Verificação

Após o deploy, verifique se:

- [ ] A página carrega sem erros
- [ ] A lista de ETFs aparece na busca
- [ ] Os gráficos são exibidos ao selecionar um ETF
- [ ] Os benchmarks (SELIC, IPCA, CDI) carregam corretamente
- [ ] O tema claro/escuro funciona

## Troubleshooting

### Erro "Failed to fetch"

**Problema:** A API não está sendo chamada corretamente.

**Solução:**
1. Verifique se o `BRAPI_TOKEN` está configurado na Vercel
2. Acesse **Project Settings > Environment Variables**
3. Confirme que a variável existe e está marcada para Production
4. Faça um novo deploy (**Deployments > ... > Redeploy**)

### Build falha com erro de módulo

**Problema:** Dependências não instaladas corretamente.

**Solução:**
1. Verifique se `package.json` contém todas as dependências
2. Na Vercel, vá em **Project Settings > General**
3. Em **Node.js Version**, selecione a versão 18.x ou superior
4. Faça um novo deploy

### Token não está sendo injetado

**Problema:** O script `inject-env.js` não executou.

**Solução:**
1. Verifique os logs do build na Vercel
2. Procure por "environment.prod.ts gerado com sucesso!"
3. Se não aparecer, verifique se `vercel.json` está correto
4. Confirme que `scripts/inject-env.js` existe no repositório

## Domínio Customizado

Para usar um domínio próprio:

1. Vá em **Project Settings > Domains**
2. Clique em **Add**
3. Digite seu domínio (ex: `etfs-brasil.com`)
4. Siga as instruções para configurar os registros DNS

## Monitoramento

A Vercel oferece:

- **Analytics:** Visualizações, performance, visitantes
- **Speed Insights:** Core Web Vitals
- **Logs:** Erros e requisições

Acesse em **Project > Analytics** e **Speed Insights**.

## Deploys Automáticos

A Vercel faz deploy automático a cada push:

- **main branch:** Deploy para produção
- **outras branches:** Deploy de preview

Para desativar:
1. **Project Settings > Git**
2. Configure **Production Branch** e **Preview Branches**

## Notas Importantes

- **Segurança:** O token é injetado durante o build e fica visível no código JavaScript do browser. Para uso em produção com alto tráfego, considere criar uma API proxy.
  
- **Limites:** A brapi.dev tem limite de 15.000 requisições/mês no plano gratuito. Monitor o uso em [brapi.dev/dashboard](https://brapi.dev/dashboard).

- **CORS:** A brapi.dev permite requisições do browser. Se mudar de API, verifique as políticas de CORS.

## Suporte

- [Documentação Vercel](https://vercel.com/docs)
- [Issues do Projeto](https://github.com/gabireze/etfs-app/issues)
- [Documentação brapi.dev](https://brapi.dev/docs)
