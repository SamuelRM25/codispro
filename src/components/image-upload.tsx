'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    label?: string
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Error en la subida')

            const data = await response.json()
            onChange(data.url)
            toast.success('Imagen subida correctamente')
        } catch (error) {
            toast.error('Error al subir la imagen')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium">{label}</label>}
            <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                {value ? (
                    <div className="relative w-full aspect-square max-w-[200px] overflow-hidden rounded-lg group">
                        <img src={value} alt="Uploaded image" className="object-cover w-full h-full" />
                        <button
                            onClick={() => onChange('')}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-4 text-slate-500">
                        <ImageIcon className="w-12 h-12 opacity-20" />
                        <p className="text-xs">Sin imagen seleccionada</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleUpload}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="gap-2"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ImageIcon className="w-4 h-4" />
                        )}
                        Subir Archivo
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            if (fileInputRef.current) {
                                fileInputRef.current.setAttribute('capture', 'environment')
                                fileInputRef.current.click()
                                // Clean up capture attribute after a delay to allow standard file picking next time
                                setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 1000)
                            }
                        }}
                        disabled={uploading}
                        className="gap-2"
                    >
                        <Camera className="w-4 h-4" />
                        Usar Cámara
                    </Button>
                </div>
            </div>
        </div>
    )
}
