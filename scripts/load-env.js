#!/usr/bin/env node

/**
 * Script para desenvolvimento local com variáveis de ambiente do .env
 * Copia o token do .env para environment.ts durante o desenvolvimento
 */

const fs = require('fs');
const path = require('path');

// Carrega o .env se existir
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env não encontrado. Crie um com BRAPI_TOKEN=seu_token');
  process.exit(0);
}

// Lê o .env
const dotenvContent = fs.readFileSync(envPath, 'utf8');
const brapiToken = dotenvContent
  .split('\n')
  .find(line => line.startsWith('BRAPI_TOKEN='))
  ?.split('=')[1]
  ?.trim() || '';

if (!brapiToken) {
  console.warn('⚠️  BRAPI_TOKEN não encontrado no .env');
  process.exit(0);
}

// Atualiza environment.ts para desenvolvimento
const envTsPath = path.join(__dirname, '../src/environments/environment.ts');

const envTsContent = `// Arquivo de ambiente para desenvolvimento
// Este arquivo foi atualizado automaticamente com o token do .env

export const environment = {
  production: false,
  brapiToken: '${brapiToken}'
};
`;

try {
  fs.writeFileSync(envTsPath, envTsContent, 'utf8');
  console.log('✅ environment.ts atualizado com o token do .env!');
  console.log(`   Token: ${brapiToken.substring(0, 8)}...`);
} catch (error) {
  console.error('❌ Erro ao atualizar environment.ts:', error);
  process.exit(1);
}
