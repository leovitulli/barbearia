const { createClient } = require('@supabase/supabase-js');
const url = 'https://kzlilaflnnbepacccijx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms';
const supabase = createClient(url, key);

async function restoreAndVerify() {
  // Volta o agendamento de volta para 09/04 as 09:00 (o original)
  const { data: result } = await supabase.rpc('bot_v1_reschedule_appointment', {
    p_phone: '310339909163921356715511947916020',
    nova_data: '2026-04-09',
    novo_horario: '09:00',
    barbeiro: 'Oscar'
  });
  console.log('Restaurado:', JSON.stringify(result, null, 2));

  // Confirma estado final
  const { data: state } = await supabase.rpc('bot_v1_get_client_state', {
    p_phone: '310339909163921356715511947916020'
  });
  console.log('Estado final do banco:', JSON.stringify(state, null, 2));
}

restoreAndVerify().then(() => process.exit(0)).catch(console.error);
