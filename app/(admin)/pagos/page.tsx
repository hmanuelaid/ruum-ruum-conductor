'use client'
import { useEffect, useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { createClient } from '@/lib/supabase'

interface Payment {
  id: string
  trip_id: string
  amount: number
  status: string
  type: string
  created_at: string
}

export default function PagosPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    const supabase = createClient()
    const { data } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
    
    setPayments(data ?? [])
    setLoading(false)
  }

  const total = payments.reduce((sum, p) => sum + (p.status === 'pagado' ? p.amount : 0), 0)

  return (
    <div style={{ padding: 20 }}>
      <div className="page-header">
        <h1 className="page-title">Pagos</h1>
        <p className="page-sub">Total recaudado: ${total.toLocaleString('es-MX')}</p>
      </div>

      {loading ? (
        <div className="card">Cargando...</div>
      ) : payments.length === 0 ? (
        <div className="card">Sin pagos registrados</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Viaje</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td className="mono">{payment.id.slice(0, 8)}</td>
                  <td className="mono">{payment.trip_id?.slice(0, 8) || '—'}</td>
                  <td className="td-bold">${payment.amount.toLocaleString('es-MX')}</td>
                  <td>{payment.type === 'cobro_usuario' ? '👤 Usuario' : '🚗 Conductor'}</td>
                  <td><Chip status={payment.status}>{payment.status}</Chip></td>
                  <td className="td-muted">{new Date(payment.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}