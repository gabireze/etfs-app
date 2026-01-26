#!/usr/bin/env node

/**
 * Script para injetar variáveis de ambiente no build do Angular
 * Este script é executado durante o build na Vercel
 * Baseado em: https://vercel.com/docs/frameworks/angular
 */

const fs = require('fs');
const path = require('path');
const successColor = '\x1b[32m%s\x1b[0m';
const errorColor = '\x1b[31m%s\x1b[0m';
const checkSign = '\u{2705}';

// Lê o token da variável de ambiente (Vercel injeta isso durante o build)
const brapiToken = process.env.BRAPI_TOKEN || '';

if (!brapiToken) {
  console.log(errorColor, '⚠️  WARNING: BRAPI_TOKEN não encontrado!');
  console.log('    Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables');
  console.log('    O aplicativo pode não funcionar corretamente.');
}

// Gera o arquivo environment.prod.ts com o token
const targetPath = path.join(__dirname, '../src/environments/environment.prod.ts');

const envFileContent = `// Este arquivo é gerado automaticamente durante o build
// NÃO EDITE MANUALMENTE - Suas alterações serão sobrescritas

export const environment = {
  production: true,
  brapiToken: '${brapiToken}'
};
`;

try {
  fs.writeFileSync(targetPath, envFileContent, 'utf8');
  console.log(successColor, `${checkSign} Successfully generated environment.prod.ts`);
  if (brapiToken) {
    console.log(successColor, `   Token configured: ${brapiToken.substring(0, 8)}...`);
  }
} catch (error) {
  console.log(errorColor, '❌ Error generating environment.prod.ts:', error);
  process.exit(1);
}
