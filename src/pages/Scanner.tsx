import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Camera, Search } from 'lucide-react'
import { useZxing } from 'react-zxing'
import { AppShell } from '../components/layout/AppShell'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { lookupBarcode } from '../lib/barcode'
import type { BarcodeResult } from '../types'

export function Scanner() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [result, setResult] = useState<BarcodeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [manualEan, setManualEan] = useState('')

  const onDecodeResult = useCallback(async (res: any) => {
    const ean = res.getText()
    setLoading(true)
    const barcodeResult = await lookupBarcode(ean)
    setResult(barcodeResult)
    setLoading(false)
  }, [])

  const { ref } = useZxing({
    onDecodeResult,
    paused: !!result || loading,
  })

  const handleManualSearch = async () => {
    if (!manualEan.trim()) return
    setLoading(true)
    const barcodeResult = await lookupBarcode(manualEan.trim())
    setResult(barcodeResult)
    setLoading(false)
  }

  const reset = () => {
    setResult(null)
    setManualEan('')
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(location.state?.returnToList ? `/lists/${location.state.returnToList}` : '/')}
            className="p-1.5 rounded-md hover:bg-accent cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{t('scan.title')}</h1>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl bg-card aspect-[3/4] max-h-[60vh] relative">
              <video ref={ref} className="h-full w-full object-cover" />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              <div className="absolute inset-0 border-[3px] border-primary/30 rounded-xl pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder={t('scan.manualInput')}
                  value={manualEan}
                  onChange={(e) => setManualEan(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                />
              </div>
              <Button variant="secondary" onClick={handleManualSearch} disabled={loading}>
                <Search size={16} />
              </Button>
            </div>
          </div>
        )}

        {result && (
          <Card className="space-y-4">
            {result.found ? (
              <>
                <div className="flex items-start gap-4">
                  {result.imageUrl && (
                    <img
                      src={result.imageUrl}
                      alt={result.productName}
                      className="h-20 w-20 rounded-lg object-cover bg-secondary"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg truncate">{result.productName}</h2>
                    {result.brand && (
                      <p className="text-sm text-muted-foreground">{result.brand}</p>
                    )}
                    <Badge variant="default" className="mt-1">
                      {result.source}
                    </Badge>
                  </div>
                </div>

                {result.prices && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-secondary p-2">
                      <p className="text-xs text-muted-foreground">Laveste</p>
                      <p className="font-semibold">
                        kr {result.prices.lowest.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary p-2">
                      <p className="text-xs text-muted-foreground">Gns.</p>
                      <p className="font-semibold">
                        kr {result.prices.avg.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary p-2">
                      <p className="text-xs text-muted-foreground">Højeste</p>
                      <p className="font-semibold">
                        kr {result.prices.highest.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      navigate(location.state?.returnToList ? `/lists/${location.state.returnToList}` : '/')
                    }}
                  >
                    {t('scan.addToList')}
                  </Button>
                  <Button variant="secondary" className="flex-1" onClick={() => navigate('/pantry')}>
                    {t('scan.addToPantry')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Camera size={40} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">{t('scan.notFound')}</p>
                <Button onClick={reset}>{t('scan.retry')}</Button>
              </div>
            )}
          </Card>
        )}

        {result && (
          <Button variant="ghost" className="w-full" onClick={reset}>
            <Camera size={16} />
            {t('scan.retry')}
          </Button>
        )}
      </div>
    </AppShell>
  )
}
