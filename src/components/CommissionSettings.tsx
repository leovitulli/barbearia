import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { DollarSign } from 'lucide-react'

interface BarberCommission {
  user_id: string
  name: string
  commission_rate: number
}

export const CommissionSettings = () => {
  const [commissionMode, setCommissionMode] = useState<'unified' | 'individual'>('individual')
  const [unifiedRate, setUnifiedRate] = useState('40.00')
  const [barbers, setBarbers] = useState<BarberCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      // Buscar modo de comissão
      const { data: modeData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'commission_mode')
        .single()

      if (modeData) {
        setCommissionMode(modeData.value as 'unified' | 'individual')
      }

      // Buscar taxa unificada
      const { data: rateData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'unified_commission_rate')
        .single()

      if (rateData) {
        setUnifiedRate(rateData.value)
      }

      // Buscar barbeiros e suas comissões
      const { data: barbersData } = await supabase
        .from('users')
        .select(`
          id,
          name,
          barber_commissions (
            commission_rate
          )
        `)
        .eq('role', 'barber')

      if (barbersData) {
        const formattedBarbers = barbersData.map(barber => ({
          user_id: barber.id,
          name: barber.name,
          commission_rate: barber.barber_commissions?.[0]?.commission_rate || 40.00
        }))
        setBarbers(formattedBarbers)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
      toast.error('Erro ao carregar configurações de comissão')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Salvar modo de comissão
      const { error: modeError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'commission_mode',
          value: commissionMode,
          description: 'Modo de comissão: unified ou individual',
          category: 'financial'
        })
      if (modeError) throw modeError

      // Salvar taxa unificada
      const { error: rateError } = await supabase
        .from('system_settings')
        .upsert({
          key: 'unified_commission_rate',
          value: unifiedRate,
          description: 'Taxa de comissão unificada',
          category: 'financial'
        })
      if (rateError) throw rateError

      // Se modo individual, salvar comissões individuais
      if (commissionMode === 'individual') {
        const upsertPromises = barbers.map(barber => 
          supabase
            .from('barber_commissions')
            .upsert({
              user_id: barber.user_id,
              commission_rate: barber.commission_rate
            })
        )
        const results = await Promise.all(upsertPromises)
        const errors = results.filter(r => r.error)
        if (errors.length > 0) {
          throw new Error('Falha ao salvar comissões individuais.')
        }
      }

      toast.success('Configurações de comissão salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const updateBarberCommission = (userId: string, rate: string) => {
    setBarbers(prev => prev.map(b => 
      b.user_id === userId 
        ? { ...b, commission_rate: parseFloat(rate) || 0 }
        : b
    ))
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Comissões dos Barbeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modo de Comissão */}
        <div className="space-y-3">
          <Label>Modo de Comissão</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="commission_mode"
                value="unified"
                checked={commissionMode === 'unified'}
                onChange={(e) => setCommissionMode(e.target.value as 'unified')}
                className="w-4 h-4"
              />
              <span>Comissão Unificada</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="commission_mode"
                value="individual"
                checked={commissionMode === 'individual'}
                onChange={(e) => setCommissionMode(e.target.value as 'individual')}
                className="w-4 h-4"
              />
              <span>Comissão Individual</span>
            </label>
          </div>
        </div>

        {/* Taxa Unificada */}
        {commissionMode === 'unified' && (
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label htmlFor="unified_rate">Porcentagem Padrão (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="unified_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={unifiedRate}
                onChange={(e) => setUnifiedRate(e.target.value)}
                className="max-w-[150px]"
              />
              <span className="text-sm text-gray-600">
                Todos os barbeiros receberão {unifiedRate}% sobre cada serviço
              </span>
            </div>
          </div>
        )}

        {/* Comissões Individuais */}
        {commissionMode === 'individual' && (
          <div className="space-y-4">
            <Label>Comissão por Barbeiro</Label>
            <div className="space-y-3">
              {barbers.map(barber => (
                <div key={barber.user_id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium flex-1">{barber.name}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={barber.commission_rate}
                      onChange={(e) => updateBarberCommission(barber.user_id, e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
