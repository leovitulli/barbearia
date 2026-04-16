const { createClient } = require('@supabase/supabase-js');
const url = 'https://kzlilaflnnbepacccijx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms';
const supabase = createClient(url, key);

async function trueAudit() {
  // 1. Busca o cliente Leo
  console.log('\n=== CLIENTES CADASTRADOS ===');
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, phone, whatsapp')
    .order('name')
    .limit(10);
  console.log(JSON.stringify(clients, null, 2));

  // 2. Todos os agendamentos futuros (sem filtro de cliente)
  console.log('\n=== TODOS AGENDAMENTOS FUTUROS (VERDADE DO BANCO) ===');
  const { data: appts } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, client_id')
    .gte('appointment_date', '2026-04-04')
    .order('appointment_date');
  console.log('Total:', appts ? appts.length : 0);
  console.log(JSON.stringify(appts, null, 2));

  // 3. Testar get_client_state com o numero limpo
  console.log('\n=== FUNCAO get_client_state (numero limpo) ===');
  const { data: state1, error: e1 } = await supabase.rpc('bot_v1_get_client_state', {
    p_phone: '5511947916020'
  });
  console.log('Resultado:', JSON.stringify(state1, null, 2));
  if (e1) console.log('Erro:', e1);

  // 4. Testar get_client_state com o contextId bruto do WhatsApp
  console.log('\n=== FUNCAO get_client_state (contextId bruto) ===');
  const { data: state2, error: e2 } = await supabase.rpc('bot_v1_get_client_state', {
    p_phone: '310339909163921356715511947916020'
  });
  console.log('Resultado:', JSON.stringify(state2, null, 2));
  if (e2) console.log('Erro:', e2);
}

trueAudit().then(() => process.exit(0)).catch(console.error);
