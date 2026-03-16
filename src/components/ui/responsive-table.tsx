import { cn } from '@/lib/utils/cn'
import { Card } from '@/components/ui/card'
import { type ReactNode } from 'react'

export interface ResponsiveTableColumn<T = any> {
  key: string
  label: string
  render?: (row: T) => ReactNode
}

interface ResponsiveTableProps<T = any> {
  columns: ResponsiveTableColumn<T>[]
  data: T[]
  className?: string
  /** Optional key extractor for stable React keys. Defaults to index. */
  rowKey?: (row: T, index: number) => string | number
}

export function ResponsiveTable<T extends Record<string, any>>({
  columns,
  data,
  className,
  rowKey,
}: ResponsiveTableProps<T>) {
  return (
    <div className={cn(className)}>
      {/* Desktop: standard HTML table */}
      <div className="hidden lg:block overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-divider bg-canvas">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 font-medium text-t3 text-xs"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                className="hover:bg-canvas/50"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-t1">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card stack */}
      <div className="lg:hidden space-y-3">
        {data.map((row, i) => (
          <Card key={rowKey ? rowKey(row, i) : i} padding="sm">
            <div className="space-y-2">
              {columns.map((col) => (
                <div key={col.key}>
                  <p className="text-xs text-t3">{col.label}</p>
                  <div className="text-sm text-t1 mt-0.5">
                    {col.render ? col.render(row) : row[col.key]}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
