import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

export function AdminPlaceholder({
  icon: Icon,
  title,
  description,
  kpis,
  columns,
  rows,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  kpis: { label: string; value: string; hint?: string }[];
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-900/40 text-slate-100">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{title}</h2>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit border-amber-500/40 bg-amber-500/10 text-[10px] uppercase tracking-widest text-amber-300">
            Em preparação · mock
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-slate-800 bg-slate-900/60 text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {k.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black tracking-tight">{k.value}</div>
              {k.hint && <div className="mt-1 text-[11px] text-slate-500">{k.hint}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-800 bg-slate-900/60 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Prévia</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  {r.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-slate-200">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
