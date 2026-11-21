# AUIN AI

Assistente em português brasileiro para dúvidas sobre a Agência Unesp de Inovação.

- **Modelo:** OpenAI GPT-6 Luna pelo Vercel AI Gateway (OIDC na Vercel).
- **Fontes:** páginas públicas do portal da AUIN; consulta atualizada ao JSON Silo público usado no mapa de empresas, sem copiar os dados para o repositório.
- **Cota:** 10 perguntas por navegador por dia, calculadas em `America/Sao_Paulo`, aplicadas no backend. Reservas atômicas em Vercel Blob privado.
- **Interface:** HTML/CSS/JS nativos, sem conta ou banco de dados próprio.

## Deploy

Vincule o repositório `metrix0/AUINAI` a um projeto Vercel. Vincule um **Vercel Blob privado** ao projeto; isso adiciona `BLOB_READ_WRITE_TOKEN` automaticamente. O Vercel AI Gateway usa `VERCEL_OIDC_TOKEN` automaticamente. Domínio desejado: `auin.johnvitor.com`.

`npm install` e `npm test` para validação local. Para testes de respostas fora da Vercel, configure `AI_GATEWAY_API_KEY` e `BLOB_READ_WRITE_TOKEN` em `.env.local` (nunca envie chaves ao Git).

### Limites
A cota é por cookie anônimo persistente. Limpar cookies ou usar outro navegador inicia uma nova identidade; restrição mais forte exige login ou rate limiting por IP (que pode prejudicar usuários em rede universitária). Nenhum dado pessoal de visitante é armazenado na base; o Blob armazena apenas identificadores derivados de hashes não reversíveis e horários de uso. A aplicação não é um canal oficial da AUIN.
