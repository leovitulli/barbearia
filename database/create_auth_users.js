// Script para criar usuários no Supabase Auth via API Admin
// Execute: node database/create_auth_users.js

const supabaseUrl = 'https://kzlilaflnnbepacccijx.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlsYWZsbm5iZXBhY2NjaWp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI5ODM3NiwiZXhwIjoyMDg2ODc0Mzc2fQ.BdaVjf__SWiyoglcLgyUwDdY0UmYb1rpu2-Vfygq-WU'

const users = [
    {
        email: 'admin@barbearia.com',
        password: '123mudar',
        user_metadata: { name: 'Rafael', role: 'admin' },
        id: '11111111-1111-1111-1111-111111111111'
    },
    {
        email: 'carlos@barbearia.com',
        password: '123mudar',
        user_metadata: { name: 'Kaue', role: 'barber' },
        id: '22222222-2222-2222-2222-222222222222'
    },
    {
        email: 'miguel@barbearia.com',
        password: '123mudar',
        user_metadata: { name: 'Oscar', role: 'barber' },
        id: '33333333-3333-3333-3333-333333333333'
    }
]

async function createUsers() {
    console.log('🚀 Criando usuários no Supabase Auth...\n')

    for (const user of users) {
        try {
            const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password,
                    email_confirm: true,
                    user_metadata: user.user_metadata,
                    id: user.id
                })
            })

            const data = await response.json()

            if (response.ok) {
                console.log(`✅ Criado: ${user.email} (${user.user_metadata.name})`)
            } else if (data.msg && data.msg.includes('already registered')) {
                console.log(`⚠️  Já existe: ${user.email} - OK!`)
            } else {
                console.log(`❌ Erro em ${user.email}:`, data.msg || JSON.stringify(data))
            }
        } catch (err) {
            console.error(`❌ Falha ao criar ${user.email}:`, err.message)
        }
    }

    console.log('\n✨ Concluído! Tente fazer login em http://localhost:5173')
}

createUsers()
