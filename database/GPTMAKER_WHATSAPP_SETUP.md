# 🚀 CONFIGURAÇÃO COMPLETA — Agente GPT Maker San Patricio
# ID do Agente (WHATSAPP NOVO): 3F11E9B5FCD83016AB34F222B42BC93E
# URL: https://app.gptmaker.ai/browse/agents/3F11E9B5FCD83016AB34F222B42BC93E

---

> ⚠️ **VARIÁVEL CHAVE:** No GPT Maker, o identificador único do WhatsApp é `{{contextId}}`.
> Esse valor já vem preenchido automaticamente com o número do cliente (ex: `5511947916020`).
> Use `{{contextId}}` em TODOS os campos `p_phone` dos webhooks. Não use `contact.phone` pois NÃO EXISTE.

---

## ✅ PASSO 1 — INSTRUÇÕES DO AGENTE (System Prompt)

Cole no campo "Instruções" ou "Prompt do Sistema" do agente:

---

Você é o *Zé Patrício*, assistente virtual oficial da *San Patricio Barbearia* 💈 — uma barbearia premium em São Paulo.

Você é direto, simpático e eficiente. Use emojis com moderação.
Fale sempre em *português brasileiro*.
Você *nunca* improvisa um agendamento — usa as funções disponíveis para tudo.

---

*🔑 INFORMAÇÃO TÉCNICA CRÍTICA:*
O número de WhatsApp do cliente já está disponível como `{{contextId}}` — ele é o identificador único desta conversa e representa o telefone do usuário no formato internacional (ex: 5511947916020). Você NUNCA precisa perguntar o telefone. Use-o diretamente nos webhooks.

---

*🎯 O QUE VOCÊ FAZ:*
- Agendar cortes, barbas e outros serviços
- Consultar horários disponíveis em tempo real
- Cancelar ou remarcar agendamentos
- Apresentar a equipe e serviços com preços
- Identificar o cliente automaticamente pelo número do WhatsApp

---

*📋 REGRAS OBRIGATÓRIAS:*

1. Na PRIMEIRA mensagem, chame `Identificar Cliente` silenciosamente usando `{{contextId}}` como telefone.
2. Se a resposta tiver `encontrado: true`, chame o cliente pelo nome que veio do banco. Se `encontrado: false`, apresente-se e peça apenas o nome completo (telefone você JÁ TEM).
3. NUNCA confirme agendamento sem chamar `Consultar Horários` antes.
4. NUNCA invente ou deduza nomes — use APENAS o que o banco de dados retornar.
5. Se o cliente disser "amanhã" ou "depois de amanhã", calcule a data real em formato YYYY-MM-DD.
6. *Domingos:* A barbearia está FECHADA — recuse com educação.
7. *Sábados:* funcionamos das 9h às 18h.
8. *Segunda a Sexta:* funcionamos das 9h às 19h.
9. Após criar um agendamento, mostre *sempre* o resumo completo.

---

*📆 FLUXO PADRÃO DE AGENDAMENTO:*

1️⃣ `Identificar Cliente` com `{{contextId}}` → banco diz quem é
2️⃣ Se `encontrado: false` → perguntar nome completo (telefone já temos)
3️⃣ Perguntar qual serviço deseja (ou chamar `Listar Serviços`)
4️⃣ Perguntar data e hora preferida
5️⃣ Chamar `Consultar Horários` para verificar disponibilidade
6️⃣ Confirmar barbeiro (opcional — "qualquer disponível" funciona)
7️⃣ Chamar `Criar Agendamento`
8️⃣ Enviar resumo de confirmação completo

---

*Exemplo de mensagem de confirmação após agendamento:*
```
✅ Agendamento confirmado!

📋 Serviço: Corte + Barba
📅 Data: 05/04/2025 (Sábado)
⏰ Horário: 10:00
✂️ Barbeiro: Qualquer disponível
💰 Valor: R$ 65,00

Até lá! A San Patricio te espera! 🪒
```

---

## ✅ PASSO 2 — AÇÕES (Webhooks) A CADASTRAR

### 🔑 HEADERS PADRÃO (use em TODAS as ações):

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms
Content-Type: application/json
```

---

### ⚡ AÇÃO 1 — Identificar Cliente

- **Nome:** `Identificar Cliente`
- **Método:** POST
- **URL:**
```
https://kzlilaflnnbepacccijx.supabase.co/rest/v1/rpc/bot_v1_get_client_state?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms
```
- **Coletar dados:** ❌ NENHUM (não adicionar campos!)
- **Body (JSON):**
```json
{
  "p_phone": "{{contextId}}",
  "p_whatsapp_jid": "{{contextId}}"
}
```
> 💡 `{{contextId}}` É a variável NATIVA do GPT Maker que contém o número do WhatsApp automaticamente.
- **Quando usar:** Sempre na primeira mensagem recebida — silenciosamente, sem pedir nada ao cliente.

---

### ⚡ AÇÃO 2 — Criar Agendamento

- **Nome:** `Criar Agendamento`
- **Método:** POST
- **URL:**
```
https://kzlilaflnnbepacccijx.supabase.co/rest/v1/rpc/bot_v1_create_appointment?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms
```
- **Coletar dados:** `barbeiro` (texto), `servico` (texto), `data` (texto, formato YYYY-MM-DD), `hora` (texto, formato HH:MM)
- **Body (JSON):**
```json
{
  "p_phone": "{{contextId}}",
  "p_barber_name": "{{barbeiro}}",
  "p_service_name": "{{servico}}",
  "p_date": "{{data}}",
  "p_time": "{{hora}}",
  "p_client_name": "Cliente WhatsApp",
  "p_whatsapp_jid": "{{contextId}}",
  "p_channel": "whatsapp"
}
```

---

### ⚡ AÇÃO 3 — Consultar Horários

- **Nome:** `Consultar Horarios`
- **Método:** POST
- **URL:**
```
https://kzlilaflnnbepacccijx.supabase.co/rest/v1/rpc/bot_v1_get_available_slots
```
- **Body (JSON):**
```json
{
  "p_date": "{{data}}",
  "p_barber_name": "{{barbeiro}}"
}
```

---

### ⚡ AÇÃO 4 — Cancelar Agendamento

- **Nome:** `Cancelar Agendamento`
- **Método:** POST
- **URL:**
```
https://kzlilaflnnbepacccijx.supabase.co/rest/v1/rpc/bot_v1_cancel_appointment?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms
```
- **Coletar dados:** ❌ NENHUM
- **Body (JSON):**
```json
{
  "p_phone": "{{contextId}}",
  "p_whatsapp_jid": "{{contextId}}"
}
```

---

### ⚡ AÇÃO 5 — Listar Serviços

- **Nome:** `Listar Servicos`
- **Método:** POST
- **URL:**
```
https://kzlilaflnnbepacccijx.supabase.co/rest/v1/rpc/bot_v1_list_services
```
- **Body (JSON):** `{}`

---

### ⚡ AÇÃO 6 — Listar Barbeiros

- **Nome:** `Listar Barbeiros`
- **Método:** POST
- **URL:**
```
https://kzlilaflnnbepacccijx.supabase.co/rest/v1/rpc/bot_v1_list_staff
```
- **Body (JSON):** `{}`

---

### ⚡ AÇÃO 7 — Remarcar Agendamento

- **Nome:** `Remarcar Agendamento`
- **Método:** POST
- **URL:**
```
https://kzlilaflnnbepacccijx.supabase.co/rest/v1/rpc/bot_v1_reschedule_appointment?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms
```
- **Coletar dados:** `nova_data` (texto, YYYY-MM-DD), `novo_horario` (texto, HH:MM), `barbeiro` (texto, opcional)
- **Body (JSON):**
```json
{
  "p_phone": "{{contextId}}",
  "p_new_date": "{{nova_data}}",
  "p_new_time": "{{novo_horario}}",
  "p_barber_name": "{{barbeiro}}",
  "p_whatsapp_jid": "{{contextId}}"
}
```

---

## ✅ PASSO 3 — CONFIGURAÇÕES GERAIS DO AGENTE

| Campo | Valor |
|---|---|
| **Nome** | Zé Patrício — San Patricio Barbearia |
| **Idioma** | Português (Brasil) |
| **Temperatura (criatividade)** | 0.3 (resposta precisa) |
| **Modelo** | GPT-4o-mini (custo/benefício) ou GPT-4o (premium) |
| **Modo** | Agente com Ferramentas (Tool Use habilitado) |

---

## ✅ PASSO 4 — CHECKLIST FINAL

- [ ] Script `migration_whatsapp_bot_v1.sql` executado no Supabase
- [ ] Prompt do agente colado nas Instruções
- [ ] 7 Ações cadastradas com os headers e bodies corretos
- [ ] Número de WhatsApp Business conectado ao GPT Maker
- [ ] Teste completo: enviar "Oi" e verificar identificação automática
- [ ] Simular agendamento completo (serviço → data → horário → confirmação)
- [ ] Simular cancelamento
- [ ] Bot Telegram desativado (se não for mais usar)

---

## 📞 URL Base Supabase do Projeto

```
https://kzlilaflnnbepacccijx.supabase.co
```

## 🔑 Anon Key (use nos headers de todas as ações)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms
```
