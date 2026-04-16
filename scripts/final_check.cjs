const { createClient } = require('@supabase/supabase-js');
const url = 'https://kzlilaflnnbepacccijx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms';
const supabase = createClient(url, key);

async function finalCleanup() {
  // Estado final real
  const { data: state } = await supabase.rpc('bot_v1_get_client_state', {
    p_phone: '310339909163921356715511947916020'
  });
  console.log('Estado do banco (via função):', JSON.stringify(state, null, 2));
}

finalCleanup().then(() => process.exit(0)).catch(console.error);
