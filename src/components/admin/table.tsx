import type React from "react"
interface Column<T> {
  header: string
  accessor: (item: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
}

export default function Table<T extends { id: string }>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sticky top-0 border-b border-foreground/10 bg-background">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className="px-6 py-3 text-left text-xs font-semibold text-foreground/60">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.id} className={`border-b border-foreground/5 ${idx % 2 === 0 ? "bg-foreground/[0.01]" : ""}`}>
              {columns.map((col) => (
                <td key={`${item.id}-${col.header}`} className="px-6 py-4 text-sm text-foreground">
                  {col.accessor(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
