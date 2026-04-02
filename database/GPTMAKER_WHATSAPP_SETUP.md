# Guia de Configuração: Agente WhatsApp no GPT Maker
## São Patricio Barbearia – Bot de Agendamento

---

## 📋 Índice Rápido
1. [Criação do Agente](#1-criação-do-agente)
2. [Prompt de Personalidade](#2-prompt-de-personalidade)
3. [Configuração das Ações (Webhooks)](#3-configuração-das-ações-webhooks)
4. [Fluxo Conversacional](#4-fluxo-conversacional)
5. [Variáveis do GPT Maker](#5-variáveis-do-gpt-maker)

---

## 1. Criação do Agente

No painel do GPT Maker:
- **Tipo:** Agente de IA (do zero)
- **Canal:** WhatsApp Business
- **Nome:** `San Patricio Barbearia Bot`
- **Modelo:** GPT-4o (ou equivalente disponível)

---

## 2. Prompt de Personalidade

Cole o seguinte no campo **"System Prompt"** ou **"Instruções do Agente"**:

```
Você é o assistente virtual da San Patricio Barbearia, uma barbearia premium em São Paulo. 
Seu nome é "Padrão San Pat" e você fala de forma direta, amigável e profissional. 
Use emojis com moderação. Fale sempre em português brasileiro.

 SUAS RESPONSABILIDADES:
- Receber agendamentos de corte de cabelo, barba e outros serviços
- Consultar horários disponíveis em tempo real
- Cancelar ou remarcar agendamentos existentes
- Apresentar a equipe e lista de serviços com preços

 REGRAS IMPORTANTES:
- O número de WhatsApp do cliente É o identificador principal. Sempre passe o número (sender_id) para as funções.
- Nunca confirme um agendamento sem verificar disponibilidade primeiro.
- Seja claro sobre datas. Se o cliente disser "amanhã", calcule a data real.
- Domingos: a barbearia está FECHADA. Recuse educadamente.
- Sábados: funcionamento até 18h.
- Semana: funcionamento das 9h às 19h.
- Se o serviço ou barbeiro não for encontrado, liste as opções disponíveis.

 FORMATO DE DATA E HORA:
- Sempre converta para o formato correto antes de chamar as funções.
- Data: YYYY-MM-DD (ex: 2024-04-15)
- Hora: HH:MM:SS (ex: 14:00:00)

 FLUXO DE AGENDAMENTO:
1. Identificar o cliente pelo número (bot_v1_get_client_state)
2. Se novo, pedir o nome
3. Perguntar o serviço desejado (ou listar via bot_v1_list_services)
4. Perguntar data e hora (ou consultar disponibilidade via bot_v1_get_available_slots)
5. Confirmar dados e criar via bot_v1_create_appointment
6. Enviar confirmação com todos os detalhes
```

---

## 3. Configuração das Ações (Webhooks)

No GPT Maker, cadastre as seguintes **"Ações"** ou **"Tools"**:

### Base URL (substitua pela URL do seu projeto Supabase):
```
https://[SEU_PROJETO].supabase.co/rest/v1/rpc/
```

### Headers padrão para TODAS as ações:
```
apikey: [SUA_SUPABASE_ANON_KEY]
Authorization: Bearer [SUA_SUPABASE_ANON_KEY]
Content-Type: application/json
```

---

### Ação 1: Identificar Cliente
- **Nome:** `Identificar Cliente`
- **URL:** `POST https://[PROJETO].supabase.co/rest/v1/rpc/bot_v1_get_client_state`
- **Body:**
```json
{
  "p_phone": "{{sender_phone}}",
  "p_whatsapp_jid": "{{sender_id}}"
}
```

---

### Ação 2: Criar Agendamento
- **Nome:** `Criar Agendamento`
- **URL:** `POST https://[PROJETO].supabase.co/rest/v1/rpc/bot_v1_create_appointment`
- **Body:**
```json
{
  "p_phone": "{{sender_phone}}",
  "p_barber_name": "{{barbeiro_escolhido}}",
  "p_service_name": "{{servico_escolhido}}",
  "p_date": "{{data_agendamento}}",
  "p_time": "{{hora_agendamento}}",
  "p_client_name": "{{sender_name}}",
  "p_whatsapp_jid": "{{sender_id}}",
  "p_channel": "whatsapp"
}
```

---

### Ação 3: Ver Horários Disponíveis
- **Nome:** `Consultar Horários`
- **URL:** `POST https://[PROJETO].supabase.co/rest/v1/rpc/bot_v1_get_available_slots`
- **Body:**
```json
{
  "p_date": "{{data_consulta}}",
  "p_barber_name": "{{barbeiro_preferido}}"
}
```

---

### Ação 4: Cancelar Agendamento
- **Nome:** `Cancelar Agendamento`
- **URL:** `POST https://[PROJETO].supabase.co/rest/v1/rpc/bot_v1_cancel_appointment`
- **Body:**
```json
{
  "p_phone": "{{sender_phone}}",
  "p_whatsapp_jid": "{{sender_id}}"
}
```

---

### Ação 5: Listar Serviços
- **Nome:** `Listar Serviços`
- **URL:** `POST https://[PROJETO].supabase.co/rest/v1/rpc/bot_v1_list_services`
- **Body:** `{}`

---

### Ação 6: Listar Barbeiros
- **Nome:** `Listar Barbeiros`
- **URL:** `POST https://[PROJETO].supabase.co/rest/v1/rpc/bot_v1_list_staff`
- **Body:** `{}`

---

### Ação 7: Remarcar Agendamento
- **Nome:** `Remarcar Agendamento`
- **URL:** `POST https://[PROJETO].supabase.co/rest/v1/rpc/bot_v1_reschedule_appointment`
- **Body:**
```json
{
  "p_phone": "{{sender_phone}}",
  "p_new_date": "{{nova_data}}",
  "p_new_time": "{{novo_horario}}",
  "p_barber_name": "{{barbeiro_preferido}}",
  "p_whatsapp_jid": "{{sender_id}}"
}
```

---

## 4. Fluxo Conversacional

```
Cliente envia mensagem
        │
        ▼
[bot_v1_get_client_state] ──▶ Cliente NOVO?
        │                          │
   Já existe                      Sim
        │                          │
        ▼                          ▼
 Boas-vindas de volta      "Qual é seu nome completo?"
 + próximo agendamento             │
        │                          ▼
        │                   Salva nome via
        │                   bot_v1_upsert_client
        │
        ▼
 O que deseja fazer?
 ├── "agendar" ──▶ list_services ──▶ get_available_slots ──▶ create_appointment
 ├── "cancelar" ──▶ cancel_appointment
 ├── "remarcar" ──▶ get_available_slots ──▶ reschedule_appointment
 ├── "serviços" ──▶ list_services
 └── "barbeiros" ──▶ list_staff
```

---

## 5. Variáveis do GPT Maker

| Variável GPT Maker | Significado | Exemplo |
|---|---|---|
| `{{sender_id}}` | JID completo do WhatsApp | `5511999999999@s.whatsapp.net` |
| `{{sender_phone}}` | Número limpo | `5511999999999` |
| `{{sender_name}}` | Nome do perfil WhatsApp | `João Silva` |

> **Nota:** No GPT Maker, o `sender_id` já vem preenchido automaticamente. É o identificador nativo do contato no WhatsApp.

---

## ✅ Checklist de Ativação

- [ ] Script `migration_whatsapp_bot_v1.sql` executado no Supabase
- [ ] Agente criado no GPT Maker com prompt de personalidade
- [ ] 7 Ações configuradas com os headers corretos
- [ ] Teste de fluxo completo (agendar → visualizar → cancelar)
- [ ] Número de WhatsApp Business conectado ao GPT Maker
- [ ] Bot antigo do Telegram desativado (token revogado)
