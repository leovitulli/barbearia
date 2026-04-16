const { createClient } = require('@supabase/supabase-js');
const url = 'https://kzlilaflnnbepacccijx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms';
const supabase = createClient(url, key);

async function deepDive() {
  // A funcao retorna dados mas a tabela esta vazia.
  // Talvez o anon key nao tenha acesso a tabela appointments com RLS!
  // Vamos verificar com a service role key
  
  console.log('=== VERIFICANDO RLS - Tentando ler appointments diretamente ===');
  const { data: appts, error: apptError } = await supabase
    .from('appointments')
    .select('*')
    .limit(5);
  console.log('Erro RLS:', apptError ? apptError.message : 'Sem erro');
  console.log('Dados:', JSON.stringify(appts, null, 2));

  // Testa se existe tabela bot_appointments ou similar
  console.log('\n=== VERIFICANDO OUTRAS TABELAS ===');
  const tables = ['bot_appointments', 'client_appointments', 'scheduled_appointments', 'bookings'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('id').limit(1);
    if (!error) console.log(`Tabela '${t}' EXISTE!`, data);
    else console.log(`Tabela '${t}' nao existe: ${error.message}`);
  }

  // A funcao SECURITY DEFINER tem permissao de bypass de RLS
  // Entao pode ser que a funcao veja dados que o anon nao ve
  // Vamos ver se o cliente existe via RPC
  console.log('\n=== CLIENTES VIA RPC (bypass RLS) ===');
  const { data: clientCheck } = await supabase.rpc('bot_v1_upsert_client', {
    p_phone: '5511947916020',
    p_name: 'Teste'
  });
  console.log('Cliente via RPC:', JSON.stringify(clientCheck, null, 2));
}

deepDive().then(() => process.exit(0)).catch(console.error);
