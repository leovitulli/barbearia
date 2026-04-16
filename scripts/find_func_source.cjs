const { createClient } = require('@supabase/supabase-js');
const url = 'https://kzlilaflnnbepacccijx.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTgzNzYsImV4cCI6MjA4Njg3NDM3Nn0.RUm7apH-1OKJUTVjq8g1lEiyB7uKLFRHeqsSmr1R_ms';
const supabase = createClient(url, key);

async function findFunctionSource() {
  // Busca o codigo-fonte real da funcao no information_schema
  const { data, error } = await supabase.rpc('get_function_source', {
    p_function_name: 'bot_v1_get_client_state'
  });
  
  if (error) {
    // Alternativa: busca direto no pg_proc via SQL raw
    console.log('Tentando via SQL direto...');
    const { data: funcData, error: e2 } = await supabase
      .from('pg_proc')
      .select('prosrc')
      .eq('proname', 'bot_v1_get_client_state')
      .limit(1);
    
    if (e2) {
      console.log('Erro pg_proc:', e2.message);
    } else {
      console.log('Fonte da funcao:', funcData);
    }
  } else {
    console.log('Fonte:', data);
  }

  // Verificar as tabelas que existem (pode ter um schema diferente)
  console.log('\n=== SCHEMAS E TABELAS ===');
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_schema, table_name')
    .eq('table_type', 'BASE TABLE')
    .not('table_schema', 'eq', 'pg_catalog');
  console.log(JSON.stringify(tables, null, 2));
}

findFunctionSource().then(() => process.exit(0)).catch(console.error);
