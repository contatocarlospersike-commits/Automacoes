'use client'

import { useState, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { importContacts } from '@/features/contacts/actions'
import { CheckCircle, FileUp, Loader2, Upload, XCircle } from 'lucide-react'
import Papa from 'papaparse'

interface ParsedContact {
  name: string
  phone: string
  email?: string
}

type ImportStep = 'upload' | 'preview' | 'result'

interface ImportResult {
  imported: number
  duplicates: number
  errors: number
  errorDetails: string[]
}

export function ImportDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<ImportStep>('upload')
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([])
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const reset = () => {
    setStep('upload')
    setParsedContacts([])
    setFileName('')
    setResult(null)
  }

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name)

    if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const contacts = mapColumnsToContacts(results.data as Record<string, string>[])
          setParsedContacts(contacts.slice(0, 10000)) // Max 10K
          setStep('preview')
        },
        error: () => {
          toast.error('Erro ao ler o arquivo CSV')
        },
      })
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Parse Excel
      try {
        const XLSX = await import('xlsx')
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet)
        const contacts = mapColumnsToContacts(data)
        setParsedContacts(contacts.slice(0, 10000))
        setStep('preview')
      } catch {
        toast.error('Erro ao ler o arquivo Excel')
      }
    } else {
      toast.error('Formato não suportado. Use .csv ou .xlsx')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleImport = () => {
    startTransition(async () => {
      const res = await importContacts(
        parsedContacts.map((c) => ({
          ...c,
          consentSource: fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
            ? 'import_xlsx'
            : 'import_csv',
        }))
      )
      setResult(res)
      setStep('result')
      if (res.imported > 0) {
        toast.success(`${res.imported} contatos importados!`)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Importar Contatos'}
            {step === 'preview' && `Preview — ${fileName}`}
            {step === 'result' && 'Resultado da Importação'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Arraste um arquivo CSV ou Excel, ou clique para selecionar'}
            {step === 'preview' && `${parsedContacts.length} contatos encontrados`}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <FileUp className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Arraste seu arquivo aqui</p>
              <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Formatos aceitos: .csv, .xlsx • Máximo: 10.000 linhas
              </p>
              <p className="text-xs text-muted-foreground">
                Colunas esperadas: nome, telefone, email (flexível)
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
            />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="max-h-[400px] overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedContacts.slice(0, 50).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>{c.name || <span className="text-destructive">vazio</span>}</TableCell>
                      <TableCell className="font-mono text-sm">{c.phone || <span className="text-destructive">vazio</span>}</TableCell>
                      <TableCell>{c.email || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsedContacts.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrando 50 de {parsedContacts.length} contatos
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button onClick={handleImport} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar {parsedContacts.length} contatos
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center rounded-lg border p-4">
                <CheckCircle className="mb-1 h-6 w-6 text-green-500" />
                <span className="text-2xl font-bold">{result.imported}</span>
                <span className="text-xs text-muted-foreground">Importados</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border p-4">
                <Badge variant="secondary" className="mb-1">=</Badge>
                <span className="text-2xl font-bold">{result.duplicates}</span>
                <span className="text-xs text-muted-foreground">Duplicatas</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border p-4">
                <XCircle className="mb-1 h-6 w-6 text-destructive" />
                <span className="text-2xl font-bold">{result.errors}</span>
                <span className="text-xs text-muted-foreground">Erros</span>
              </div>
            </div>

            {result.errorDetails.length > 0 && (
              <div className="max-h-[200px] overflow-auto rounded-md border p-3 text-sm">
                {result.errorDetails.map((err, i) => (
                  <p key={i} className="text-destructive">{err}</p>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => { setIsOpen(false); reset() }}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Smart column mapping — handles different column naming conventions
function mapColumnsToContacts(rows: Record<string, string>[]): ParsedContact[] {
  if (rows.length === 0) return []

  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim())

  const nameCol = headers.find((h) =>
    ['name', 'nome', 'full_name', 'nome_completo', 'contato', 'contact'].includes(h)
  ) ?? headers[0]

  const phoneCol = headers.find((h) =>
    ['phone', 'telefone', 'tel', 'celular', 'mobile', 'whatsapp', 'numero', 'number'].includes(h)
  ) ?? headers[1]

  const emailCol = headers.find((h) =>
    ['email', 'e-mail', 'e_mail', 'mail'].includes(h)
  )

  return rows
    .filter((row) => {
      const name = row[Object.keys(row).find((k) => k.toLowerCase().trim() === nameCol) ?? '']
      const phone = row[Object.keys(row).find((k) => k.toLowerCase().trim() === phoneCol) ?? '']
      return name && phone
    })
    .map((row) => {
      const keys = Object.keys(row)
      const nameKey = keys.find((k) => k.toLowerCase().trim() === nameCol) ?? keys[0]
      const phoneKey = keys.find((k) => k.toLowerCase().trim() === phoneCol) ?? keys[1]
      const emailKey = emailCol ? keys.find((k) => k.toLowerCase().trim() === emailCol) : undefined

      return {
        name: row[nameKey] ?? '',
        phone: String(row[phoneKey] ?? ''),
        email: emailKey ? row[emailKey] : undefined,
      }
    })
}
