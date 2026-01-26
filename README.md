# Simulador de Carteira de ETFs Brasil

> **Ferramenta gratuita e open-source para simular, analisar e comparar carteiras de ETFs brasileiros com benchmarks econômicos (SELIC, IPCA)**

[![Angular](https://img.shields.io/badge/Angular-21.1-DD0031?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.5-FF6384?logo=chartdotjs)](https://www.chartjs.org/)

![Screenshot do Simulador](docs/screenshot.png)

## Funcionalidades

### Análise Completa
- **28+ ETFs Brasileiros** organizados em 7 categorias
- **Comparação com Benchmarks**: SELIC e IPCA dos últimos 3 meses
- **Gráficos Interativos**: Retorno acumulado e preços históricos
- **Carteiras Personalizadas**: Defina pesos personalizados para cada ETF

### Interface Moderna
- **Tema Claro/Escuro** inspirado no brapi.dev
- **Design Responsivo** - funciona em mobile, tablet e desktop
- **Seleção Intuitiva** - chips clicáveis sem checkboxes
- **Performance Visual** - 60 FPS com transições suaves

### Categorias de ETFs
- **Ações Brasil**: BOVA11, SMAL11, PIBB11, etc.
- **Internacional**: IVVB11, NASD11, ACWI11
- **Dividendos**: DIVO11, NDIV11, QQQI11
- **Renda Fixa**: IMAB11, FIXA11, IB5M11
- **Cripto**: HASH11, QBTC11, QETH11
- **Commodities**: GOLD11
- **Setoriais**: ESGB11, ALUG11

## Demo

**[🚀 Ver Demo ao Vivo](https://etfs-app.vercel.app/)**

## Pré-requisitos

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 10+ (incluído com Node.js)
- **Token brapi.dev** (gratuito) - [Obter aqui](https://brapi.dev/dashboard)

## Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/gabireze/etfs-app.git
cd etfs-app
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure o Token da API
Crie um arquivo `.env` na raiz do projeto:
```bash
# .env
BRAPI_TOKEN=seu_token_aqui
```

**Obtenha seu token gratuito**: [brapi.dev/dashboard](https://brapi.dev/dashboard)

> 💡 **Nota**: O arquivo `.env` já está no `.gitignore` - seu token não será commitado.

## Como Usar

### Desenvolvimento
```bash
npm start
# O script carrega automaticamente o token do .env
```
Acesse: `http://localhost:4200`

### Build para Produção
```bash
npm run build
```
Os arquivos compilados estarão em `dist/etfs-app/browser/`

## 🚀 Deploy

### Deploy na Vercel (Recomendado)
Siga o guia completo: **[DEPLOY.md](./DEPLOY.md)**

**Resumo rápido:**
1. Importe o projeto na [Vercel](https://vercel.com/new)
2. Configure `BRAPI_TOKEN` em Environment Variables
3. Deploy automático ✅

### Deploy Manual (Netlify, GitHub Pages)
```bash
npm run build
# Faça upload da pasta dist/etfs-app/browser/
```

> ⚠️ **Importante**: Para Vercel, configure a variável `BRAPI_TOKEN` nas Environment Variables do projeto. O token será injetado automaticamente durante o build.

## Arquitetura

```
src/
├── app/
│   ├── etf-chart/                    # Componente principal
│   │   ├── etf-chart.component.ts    # Lógica da aplicação
│   │   ├── etf-chart.component.html  # Template
│   │   └── etf-chart.component.css   # Estilos
│   ├── services/
│   │   └── etf.service.ts            # Integração com brapi.dev
│   └── app.routes.ts                 # Configuração de rotas
├── environments/
│   └── environment.ts                # Variáveis de ambiente
└── public/
    └── etfs.json                     # Catálogo de 28 ETFs
```

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Angular** | 21.1 | Framework principal |
| **TypeScript** | 5.9 | Linguagem de programação |
| **Tailwind CSS** | 4.1 | Estilização e temas |
| **Chart.js** | 4.5 | Gráficos interativos |
| **ng2-charts** | 8.0 | Wrapper Angular para Chart.js |
| **RxJS** | 7.8 | Programação reativa |
| **brapi.dev API** | - | Dados financeiros da B3 |

## Fonte de Dados

### API brapi.dev
- **Dados históricos**: Cotações OHLCV dos últimos 3 meses
- **Benchmarks**: SELIC (série 11) e IPCA (série 433) via BCB
- **Atualização**: Dados atualizados diariamente
- **Rate limit (free)**: 15.000 requisições/mês

💡 **Dica**: Para dados históricos mais extensos (10+ anos) e maior volume de requisições, considere o [plano Pro](https://brapi.dev/pricing).

## Temas

### Tema Claro
- Fundo: `#f7f9fc`
- Cards: `#ffffff`
- Accent: `#10b981` (verde brapi.dev)

### Tema Escuro
- Fundo: `#0f172a`
- Cards: `#1e293b`
- Accent: `#10b981`

Alterne entre temas usando o botão ☀️/🌙 no header.

## Segurança

- ✅ Token armazenado em `.env` (não commitado)
- ✅ `.gitignore` configurado para proteger credenciais
- ✅ HTTPS recomendado em produção
- ⚠️ **Importante**: Nunca exponha tokens em código cliente

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Ideias de Contribuição
- [ ] Adicionar mais ETFs ao catálogo
- [ ] Implementar comparação entre múltiplas carteiras
- [ ] Adicionar cálculo de sharpe ratio
- [ ] Exportar dados para CSV/PDF
- [ ] Gráficos de pizza para alocação
- [ ] Integração com outras APIs (Yahoo Finance, Alpha Vantage)

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

Desenvolvido com ❤️ usando Angular e brapi.dev

## Agradecimentos

- [brapi.dev](https://brapi.dev) - API de dados financeiros brasileiros
- [Angular Team](https://angular.io) - Framework incrível
- [Chart.js](https://www.chartjs.org) - Biblioteca de gráficos
- Comunidade open-source

## Suporte

- **Issues**: [GitHub Issues](https://github.com/gabireze/etfs-app/issues)
- **Email**: seu-email@exemplo.com
- **Discussões**: [GitHub Discussions](https://github.com/gabireze/etfs-app/discussions)

---

**Gostou do projeto? Deixe uma estrela no GitHub!**

### Gráfico não aparece
- Abra o console do navegador (F12) para verificar erros
- Verifique se o ticker do ETF está correto

### Erro de CORS
- A brapi.dev permite requisições do frontend
- Se persistir, considere criar um backend proxy

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
