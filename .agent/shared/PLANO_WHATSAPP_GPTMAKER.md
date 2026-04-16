# Plano de Integração WhatsApp + GPTMAKER

> Conversa com opencode em 01/04/2026 — San Patricio Barbearia

---

## 📌 Contexto

O sistema já tem integração com GPTMAKER via Supabase RPC (funções nomeadas como "telegram" mas são agnósticas de plataforma). O WhatsApp entrega muito mais dados do usuário (nome, telefone) que o Telegram, o que permite simplificar intents e criar fluxos mais inteligentes.

---

## 🧠 Análise do Sistema Atual

### O que já existe
- **7 RPC functions** no Supabase (`create_appointment_telegram`, `buscar_cliente_por_telefone_telegram`, `verificar_disponibilidade_telegram`, `listar_servicos_telegram`, `listar_barbeiros_telegram`, `remarcar_agendamento_telegram`, `cancelar_agendamento_telegram`)
- **2 Edge Functions** (`get-available-times`, `create-barber-user`)
- **Campo `whatsapp`** na tabela `clients`
- **Sistema de pacotes** completo (`service_packages`, `client_packages`, `package_usage`)
- **Tabela `reviews`** referenciada no Dashboard mas não implementada
- **RLS policies** permitindo acesso anônimo às RPC functions

### O que falta
- Envio de mensagens (lembretes, confirmações, pós-venda)
- Webhook para receber mensagens do WhatsApp
- Pesquisa de satisfação
- Venda de pacotes pelo bot
- Normalização de telefone
- Campanhas segmentadas

---

## 🗺️ Mapa de Intents para WhatsApp

### 1. `cliente_identificado` (gatilho automático)

**Quando:** WhatsApp entrega o número → bot busca no banco

```
WhatsApp → +5511999999999
GPTMAKER → chama RPC buscar_cliente_por_telefone
Se existe → "Olá João! 👋 Quer agendar um corte?"
Se não existe → vai pra intent 2 (cadastro_automatico)
```

**Dados que já chegam:** Nome (se salvo na agenda), Telefone (sempre), Foto de perfil (opcional)

---

### 2. `cadastro_automatico` (cliente novo)

**Quando:** Telefone não existe no banco

```
Bot: "Vi que é a primeira vez por aqui! Qual seu nome?"
Cliente: "Carlos"
Bot: "Pronto Carlos, já te cadastrei! Quer agendar?"
→ Cria cliente no banco automaticamente
```

**RPC:** Usar `create_appointment_telegram` (já faz upsert) ou criar `criar_cliente_whatsapp(nome, telefone)`

---

### 3. `saudacao_recorrente` (cliente com histórico)

**Quando:** Cliente identificado com histórico de agendamentos

```
Bot: "E aí Rafael! Faz 2 semanas do último corte. Bora renovar?"
```

**Dados usados:** Último agendamento, serviço mais comum, barbeiro preferido, se tem pacote ativo

**RPC:** `buscar_atendimento_atual` já existe e retorna isso

---

### 4. `agendamento_simples`

**Quando:** Cliente quer agendar

```
Cliente: "Quero agendar"
Bot: "Beleza! Corte, barba ou os dois?"
Cliente: "Corte"
Bot: "Com o Diego ou outro barbeiro?" (se tiver preferido, sugere)
Cliente: "Diego"
Bot: "Tenho esses horários amanhã: 14:00, 15:30, 17:00. Qual prefere?"
Cliente: "15:30"
Bot: "Fechado! Terça 15:30 com Diego. Te mando lembrete antes!"
```

**RPCs:** `listar_barbeiros_telegram`, `listar_servicos_telegram`, `verificar_disponibilidade_telegram`, `create_appointment_telegram`

---

### 5. `reagendamento_facilitado`

**Quando:** Cliente quer remarcar OU bot sugere baseado em histórico

```
Cliente: "Preciso mudar meu horário"
Bot: "Seu agendamento é quinta 16h com Diego. Quer mudar pra qual dia?"
→ Mostra horários alternativos
→ Chama `remarcar_agendamento_telegram`
```

**Variação proativa:**
```
Bot: "Vi que você não consegue vir na quinta. Quer mudar pra sexta?"
```

---

### 6. `cancelamento`

```
Cliente: "Quero cancelar"
Bot: "Seu agendamento é amanhã 14h. Confirmar cancelamento?"
Cliente: "Sim"
Bot: "Cancelado! Quando quiser agendar de novo é só chamar."
→ Chama `cancelar_agendamento_telegram`
```

---

### 7. `upsell_inteligente` (venda de pacotes)

**Quando:** Ao agendar OU baseado em histórico

```
→ Cliente agenda 3º corte do mês
Bot: "João, você fez 3 cortes esse mês. Um pacote de 4 cortes sai R$80 (normal R$100). Quer aproveitar?"
Cliente: "Quero!"
Bot: "Pacote ativado! Esse corte já entra no pacote."
```

**RPC nova necessária:** `verificar_pacotes_sugeridos(telefone)`

**Lógica:**
- Conta agendamentos dos últimos 30 dias por serviço
- Compara com pacotes existentes
- Sugere se economia > 15%

---

### 8. `lembrete_proativo` (2h antes)

**Quando:** Cron job ou Edge Function agendada

```
Bot: "João, te esperando às 15h com o Diego! Vai conseguir vir?"
Cliente: "Sim" → Bot marca como confirmado
Cliente: "Não" → Bot oferece remarcação
Cliente: (sem resposta) → Mantém agendado
```

**Impacto:** Redução drástica de no-show

---

### 9. `pos_atendimento` (após completar)

**Quando:** Agendamento marcado como `completed` no sistema

```
Bot: "João, como foi o corte com o Diego? De 1 a 5 estrelas?"
→ Dispara pesquisa de satisfação
```

---

### 10. `pesquisa_satisfacao` ⭐

**Fluxo completo:**

```
Bot: "Como foi seu atendimento? ⭐⭐⭐⭐⭐"
Cliente: "4"
Bot: "O que podemos melhorar? (opcional)"
Cliente: "Demorou um pouco"
Bot: "Valeu pelo feedback João! Ajuda demais 💪"
```

**Tabela necessária:**
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  barber_id UUID REFERENCES barber_profiles(id),
  appointment_id UUID REFERENCES appointments(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  source TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RPC nova:** `enviar_avaliacao_telegram(appointment_id, rating, comment)`

**Uso dos dados:**
- Exibir no Dashboard
- Alerta admin se rating < 3
- Barbeiro vê sua média no Profile
- Cliente com rating alto → oferta de indicação

---

### 11. `campanha_segmentada` (admin inicia)

**Quando:** Admin dispara pelo painel

```
Admin seleciona: "Clientes que não vêm há 30 dias"
Bot envia: "João, faz um mês que não te vemos! Volta essa semana com 15% OFF?"
```

**Tabela nova:**
```sql
CREATE TABLE whatsapp_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL, -- 'inactive_30d', 'inactive_60d', 'package_expired', etc
  message_template TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'sending', 'completed'
  sent_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 12. `status_pedido` (cliente pergunta do agendamento)

```
Cliente: "Como tá meu agendamento?"
Bot: "Você tem um corte amanhã 14h com Diego ✅"
```

---

## 📊 Resumo do que precisa criar

### RPCs novas (database/)
| Função | Descrição |
|--------|-----------|
| `criar_cliente_whatsapp(nome, telefone)` | Cria cliente com dados do WhatsApp |
| `verificar_pacotes_sugeridos(telefone)` | Analisa histórico e sugere pacotes |
| `enviar_avaliacao_telegram(appointment_id, rating, comment)` | Salva avaliação |

### Tabelas novas
| Tabela | Descrição |
|--------|-----------|
| `reviews` | Avaliações de satisfação |
| `whatsapp_messages` | Log de mensagens enviadas/recebidas |
| `whatsapp_campaigns` | Campanhas segmentadas |

### Edge Functions (supabase/functions/)
| Função | Descrição |
|--------|-----------|
| `whatsapp-webhook` | Recebe mensagens do WhatsApp |
| `send-reminders` | Cron job para lembretes 2h antes |
| `send-post-service` | Cron job para pesquisa pós-atendimento |

### Intents no GPTMAKER
Todas as 12 listadas acima

---

## 🎯 Ordem recomendada de implementação

1. **Base:** Tabelas `reviews`, `whatsapp_messages`, `whatsapp_campaigns`
2. **Intents essenciais:** `cliente_identificado`, `agendamento_simples`, `cancelamento`, `reagendamento_facilitado`
3. **Pesquisa de satisfação:** `pos_atendimento` + `pesquisa_satisfacao`
4. **Upsell de pacotes:** `upsell_inteligente` + RPC `verificar_pacotes_sugeridos`
5. **Lembretes proativos:** Edge Function `send-reminders`
6. **Campanhas:** Painel admin + `campanha_segmentada`

---

## 🔧 Infraestrutura necessária

### Opções de WhatsApp
| Opção | Prós | Contras |
|-------|------|---------|
| **Evolution API** (recomendado) | Open-source, fácil deploy, QR code | Precisa de servidor |
| **WhatsApp Cloud API (Meta)** | Oficial, confiável | Aprovação, custo por mensagem |
| **Baileys** | Leve, sem servidor extra | Não-oficial, risco de ban |

### Arquitetura sugerida
```
Cliente WhatsApp → Evolution API → Webhook → Supabase Edge Function
                                              ↓
                                    GPTMAKER (processa NLP)
                                              ↓
                                    Supabase RPC Functions
                                              ↓
                                    Banco de dados (PostgreSQL)
```

---

## 💡 Observações importantes

1. **Nome "telegram" nas funções:** É só um rótulo. As funções são agnósticas de plataforma.
2. **WhatsApp janela de 24h:** Após última mensagem do cliente, só pode enviar templates aprovados.
3. **Templates:** Mensagens proativas (lembretes, campanhas) precisam ser templates aprovados pela Meta.
4. **Normalização de telefone:** Garantir formato +55DDNNNNNNNNN antes de enviar.
5. **RLS:** As funções RPC atuais já permitem acesso anônimo — funciona para o bot.
