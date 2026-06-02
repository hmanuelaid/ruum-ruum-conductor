'use client'
import { useState, useRef } from 'react'
import {
  EVIDENCE_ACCEPTED_TYPES,
  EVIDENCE_MAX_SIZE_BYTES,
  EVIDENCE_MAX_SIZE_MB,
  uploadTripEvidence,
} from '@/lib/storage'

interface CameraUploadProps {
  tripId: string
  type: 'pickup' | 'delivery'
  onUploadComplete: () => void
}

export default function CameraUpload({ tripId, type, onUploadComplete }: CameraUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > EVIDENCE_MAX_SIZE_BYTES) {
      alert(`La foto no puede superar ${EVIDENCE_MAX_SIZE_MB}MB`)
      return
    }

    if (!EVIDENCE_ACCEPTED_TYPES.includes(file.type)) {
      alert('Solo se permiten imágenes')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    await uploadPhoto(file)
  }

  async function uploadPhoto(file: File) {
    setUploading(true)

    try {
      const result = await uploadTripEvidence({
        file,
        tripId,
        type,
        notes,
      })

      if ('error' in result) throw new Error(result.error)

      alert(`✅ Evidencia de ${type === 'pickup' ? 'recogida' : 'entrega'} guardada`)
      onUploadComplete()
      
    } catch (error) {
      console.error('Error:', error)
      alert('Error al subir la foto. Intenta nuevamente.')
    } finally {
      setUploading(false)
    }
  }

  const label = type === 'pickup' ? '📸 Evidencia de recogida' : '📸 Evidencia de entrega'
  const sublabel = type === 'pickup' 
    ? 'Toma foto del vehículo antes de iniciar el traslado' 
    : 'Toma foto del vehículo al finalizar la entrega'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '2px solid var(--primary)',
      borderRadius: 12,
      padding: 16,
      marginTop: 12
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{sublabel}</p>
      
      {!preview ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%',
            padding: 32,
            border: '2px dashed var(--border)',
            borderRadius: 10,
            background: 'var(--surface-2)',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 14
          }}
        >
          {uploading ? '📤 Subiendo...' : '📷 Tomar foto o seleccionar'}
        </button>
      ) : (
        <div>
          <img 
            src={preview} 
            alt="Preview" 
            style={{ width: '100%', borderRadius: 10, marginBottom: 12 }}
          />
          <button
            onClick={() => {
              setPreview(null)
              fileInputRef.current?.click()
            }}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            📷 Tomar otra foto
          </button>
        </div>
      )}
      
      <textarea
        placeholder="Notas adicionales (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginTop: 12,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text)',
          fontSize: 13
        }}
        rows={2}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept={EVIDENCE_ACCEPTED_TYPES.join(',')}
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  )
}
