const { createClient } = require('@supabase/supabase-js');
const url = 'https://kzlilaflnnbepacccijx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms';
const supabase = createClient(url, key);

async function fullTest() {
  console.log('=== 1. ESTADO ATUAL DO CLIENTE ===');
  const { data: state } = await supabase.rpc('bot_v1_get_client_state', {
    p_phone: '310339909163921356715511947916020'
  });
  console.log(JSON.stringify(state, null, 2));

  console.log('\n=== 2. SIMULANDO REMARCAÇÃO (09/04 para 10/04 as 11:00) ===');
  const { data: reschedule, error } = await supabase.rpc('bot_v1_reschedule_appointment', {
    p_phone: '310339909163921356715511947916020',
    nova_data: '2026-04-10',
    novo_horario: '11:00',
    barbeiro: 'Oscar'
  });
  console.log('Resultado:', JSON.stringify(reschedule, null, 2));
  if (error) console.log('Erro:', error.message);

  console.log('\n=== 3. VERIFICANDO SE MUDOU ===');
  const { data: state2 } = await supabase.rpc('bot_v1_get_client_state', {
    p_phone: '310339909163921356715511947916020'
  });
  console.log(JSON.stringify(state2, null, 2));
}

fullTest().then(() => process.exit(0)).catch(console.error);
