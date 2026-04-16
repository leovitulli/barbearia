const { createClient } = require('@supabase/supabase-js');
const url = 'https://kzlilaflnnbepacccijx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms';
const supabase = createClient(url, key);

async function findRealData() {
  // O upsert criou um cliente novo (is_new: true)
  // Mas a funcao get_client_state acha "Leo Vitulli"
  // Isso significa que HA UM CLIENTE JA CADASTRADO com outro telefone/id
  
  // Vamos buscar TODOS os clientes sem filtro
  console.log('=== TODOS OS CLIENTES NO BANCO ===');
  const { data: allClients, error } = await supabase
    .from('clients')
    .select('id, name, phone, whatsapp, whatsapp_jid')
    .order('name');
  
  if (error) {
    console.log('Erro RLS ao buscar clientes:', error.message);
  } else {
    console.log('Total de clientes:', allClients.length);
    console.log(JSON.stringify(allClients, null, 2));
  }

  // Agora vamos buscar appointments de TODOS os clientes
  console.log('\n=== TODOS OS APPOINTMENTS (INCLUINDO PASSADOS) ===');
  const { data: allAppts } = await supabase
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, client_id')
    .order('appointment_date', { ascending: false })
    .limit(10);
  console.log('Total:', allAppts ? allAppts.length : 0);
  console.log(JSON.stringify(allAppts, null, 2));
  
  // Apaga o cliente fantasma que acabamos de criar
  console.log('\n=== REMOVENDO CLIENTE FANTASMA CRIADO PELO TESTE ===');
  const { error: delError } = await supabase
    .from('clients')
    .delete()
    .eq('id', 'f91ecaef-9811-408b-ac85-ae01e263252d');
  if (delError) console.log('Erro ao apagar:', delError.message);
  else console.log('Cliente fantasma removido!');
}

findRealData().then(() => process.exit(0)).catch(console.error);
