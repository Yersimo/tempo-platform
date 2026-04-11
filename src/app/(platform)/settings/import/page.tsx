'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload, Download, FileSpreadsheet, FileText, History, ArrowRight,
  CheckCircle, XCircle, AlertTriangle, RotateCcw, Loader2, Trash2,
  Users, Globe, Building2, Layers, DollarSign, Shield, Clock,
} from 'lucide-react'
import { ImportWizard } from '@/components/import/import-wizard'
import { getImportHistory, getImportStats, rollbackImport, type ImportRecord } from '@/lib/import/import-history'
import { getAvailableTemplates, generateTemplateCSV, IMPORT_TEMPLATES } from '@/lib/import/templates'
import { downloadExcelTemplate } from '@/lib/import/excel-handler'
import { INTEGRATION_CATALOG } from '@/lib/integrations'
import { useTempo } from '@/lib/store'
import { cn } from '@/lib/utils/cn'

// ============================================================
// Migration Source Cards
// ============================================================

const MIGRATION_SOURCES = [
  { id: 'bamboohr', name: 'BambooHR', icon: <Users size={20} />, description: 'Import employees, org structure, and time-off data', color: 'bg-green-50 border-green-200' },
  { id: 'gusto', name: 'Gusto', icon: <DollarSign size={20} />, description: 'Import employees, payroll runs, and departments', color: 'bg-blue-50 border-blue-200' },
  { id: 'deel', name: 'Deel', icon: <Globe size={20} />, description: 'Import employees, contractors, contracts, and invoices', color: 'bg-purple-50 border-purple-200' },
  { id: 'rippling', name: 'Rippling', icon: <Layers size={20} />, description: 'Import employees, departments, and payroll data', color: 'bg-teal-50 border-teal-200' },
  { id: 'workday', name: 'Workday', icon: <Building2 size={20} />, description: 'Import from Workday HCM suite', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'sap', name: 'SAP SuccessFactors', icon: <Building2 size={20} />, description: 'Import from SAP SuccessFactors HR', color: 'bg-teal-50 border-teal-200' },
]

// ============================================================
// Page Component
// ============================================================

export default function ImportSettingsPage() {
  const { org } = useTempo()
  const orgId = org?.id || ''
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardEntityType, setWizardEntityType] = useState<string | undefined>()
  const [importHistory, setImportHistory] = useState<ImportRecord[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setImportHistory(getImportHistory(orgId))
  }, [orgId, refreshKey])

  const stats = getImportStats(orgId)
  const templates = getAvailableTemplates()

  const connectedIntegrations = INTEGRATION_CATALOG.filter(i =>
    ['bamboohr', 'gusto', 'deel', 'rippling', 'workday', 'sap-successfactors'].includes(i.id)
  )

  const openWizard = useCallback((entityType?: string) => {
    setWizardEntityType(entityType)
    setWizardOpen(true)
  }, [])

  const handleImportComplete = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const handleRollback = useCallback((id: string) => {
    const result = rollbackImport(id)
    if (result.success) {
      setRefreshKey(k => k + 1)
    }
  }, [])

  const statusBadge = (status: ImportRecord['status']) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>
      case 'partial': return <Badge variant="warning">Partial</Badge>
      case 'failed': return <Badge variant="error">Failed</Badge>
      case 'rolled_back': return <Badge variant="info">Rolled Back</Badge>
    }
  }

  return (
    <>
      <Header title="Data Import" subtitle="Import data from files or migrate from other platforms" />

      <div className="p-6 space-y-8 max-w-6xl mx-auto">
        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => openWizard()}>
            <Upload size={16} /> Import Data
          </Button>
          <Button variant="secondary" onClick={() => openWizard('employees')}>
            <Users size={16} /> Import Employees
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tempo-50 flex items-center justify-center">
                <Upload size={18} className="text-tempo-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-t1">{stats.totalImports}</p>
                <p className="text-[0.65rem] text-t3">Total Imports</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-t1">{stats.totalRecordsImported}</p>
                <p className="text-[0.65rem] text-t3">Records Imported</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-t1">{stats.totalErrors}</p>
                <p className="text-[0.65rem] text-t3">Total Errors</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-t1">
                  {stats.lastImportDate
                    ? new Date(stats.lastImportDate).toLocaleDateString()
                    : 'Never'}
                </p>
                <p className="text-[0.65rem] text-t3">Last Import</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Migrate From */}
        <div>
          <h2 className="text-sm font-semibold text-t1 mb-3">Migrate From Another Platform</h2>
          <div className="grid grid-cols-3 gap-4">
            {MIGRATION_SOURCES.map(source => (
              <button
                key={source.id}
                onClick={() => openWizard('employees')}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border transition-all text-left hover:shadow-md',
                  source.color
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-white/80 border border-gray-200 flex items-center justify-center text-t2 shrink-0">
                  {source.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-t1">{source.name}</p>
                  <p className="text-[0.65rem] text-t3 mt-0.5 line-clamp-2">{source.description}</p>
                  <span className="inline-flex items-center gap-1 text-[0.6rem] font-medium text-tempo-600 mt-2">
                    Start Migration <ArrowRight size={10} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Import Templates */}
        <div>
          <h2 className="text-sm font-semibold text-t1 mb-3">Download Import Templates</h2>
          <div className="grid grid-cols-2 gap-3">
            {templates.map(t => (
              <div key={t.key} className="flex items-center justify-between p-3 bg-canvas rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={16} className="text-t3" />
                  <div>
                    <p className="text-xs font-medium text-t1">{t.name}</p>
                    <p className="text-[0.6rem] text-t3">{t.description}</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const csv = generateTemplateCSV(t.key)
                      if (csv) {
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${t.key}-template.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                      }
                    }}
                  >
                    <FileText size={12} /> CSV
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const tpl = IMPORT_TEMPLATES[t.key]
                      if (tpl) downloadExcelTemplate(`${t.key}-template`, tpl.headers, tpl.sampleRows, tpl.name)
                    }}
                  >
                    <FileSpreadsheet size={12} /> XLSX
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Import History */}
        <div>
          <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
            <History size={16} /> Import History
          </h2>
          {importHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <History size={28} className="mx-auto mb-3 text-t3" />
              <p className="text-sm text-t2">No imports yet</p>
              <p className="text-xs text-t3 mt-1">Your import history will appear here</p>
            </Card>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-canvas border-b border-gray-200">
                    <th className="px-4 py-2.5 text-left font-medium text-t3">Date</th>
                    <th className="px-4 py-2.5 text-left font-medium text-t3">Source</th>
                    <th className="px-4 py-2.5 text-left font-medium text-t3">Entity Type</th>
                    <th className="px-4 py-2.5 text-left font-medium text-t3">File</th>
                    <th className="px-4 py-2.5 text-right font-medium text-t3">Rows</th>
                    <th className="px-4 py-2.5 text-right font-medium text-t3">Imported</th>
                    <th className="px-4 py-2.5 text-right font-medium text-t3">Errors</th>
                    <th className="px-4 py-2.5 text-left font-medium text-t3">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium text-t3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {importHistory.map(record => (
                    <tr key={record.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-t2 whitespace-nowrap">
                        {new Date(record.importedAt).toLocaleDateString()}{' '}
                        <span className="text-t3">{new Date(record.importedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="info">{record.source}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-t1 capitalize">{record.entityType.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2.5 text-t2 max-w-[150px] truncate">{record.fileName || '-'}</td>
                      <td className="px-4 py-2.5 text-t1 text-right tabular-nums">{record.totalRows}</td>
                      <td className="px-4 py-2.5 text-green-600 text-right tabular-nums">{record.importedRows}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {record.errorRows > 0 ? (
                          <span className="text-red-500">{record.errorRows}</span>
                        ) : (
                          <span className="text-t3">0</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">{statusBadge(record.status)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {(record.status === 'completed' || record.status === 'partial') && record.importedIds.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRollback(record.id)}
                          >
                            <RotateCcw size={12} /> Undo
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Connected Integrations */}
        <div>
          <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
            <Shield size={16} /> Connected Integrations for Import
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {connectedIntegrations.map(integration => (
              <Card key={integration.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-canvas border border-gray-200 flex items-center justify-center text-t2">
                    {MIGRATION_SOURCES.find(m => m.id === integration.id)?.icon || <Globe size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1">{integration.name}</p>
                    <p className="text-[0.6rem] text-t3 truncate">{integration.capabilities.join(', ')}</p>
                  </div>
                  <Badge variant="info">{integration.status === 'available' ? 'Available' : 'Coming Soon'}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Import Wizard Modal */}
      <ImportWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        entityType={wizardEntityType}
        orgId={orgId}
        onImportComplete={handleImportComplete}
      />
    </>
  )
}
