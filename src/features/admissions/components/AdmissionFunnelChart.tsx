import React from "react";
import { Filter, Download, ArrowDown } from "lucide-react";
import type { AdmissionsDashboardData } from "../../../services/admissionsDashboardService";

interface AdmissionFunnelChartProps {
  funnel: AdmissionsDashboardData["admissionFunnel"];
  onExportFunnel: () => void;
  loading?: boolean;
}

export const AdmissionFunnelChart: React.FC<AdmissionFunnelChartProps> = ({
  funnel = [],
  onExportFunnel,
  loading,
}) => {
  if (loading) {
    return <div className="h-72 rounded-xl border border-border bg-surface p-5 animate-pulse" />;
  }

  const maxCount = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-pink-500/10 text-pink-500">
            <Filter size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Admission Pipeline Funnel</h3>
            <p className="text-[11px] text-text-muted">Lead progression through pipeline status stages</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExportFunnel}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition cursor-pointer"
        >
          <Download size={14} />
          <span>Download Funnel CSV</span>
        </button>
      </div>

      <div className="space-y-3 pt-2">
        {funnel.length === 0 ? (
          <p className="py-8 text-center text-xs text-text-muted">No funnel stage data available.</p>
        ) : (
          funnel.map((stage, index) => {
            const widthPct = Math.max(Math.round((stage.count / maxCount) * 100), 8);
            return (
              <div key={stage.stageId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full inline-block"
                      style={{ backgroundColor: stage.color || "#3B82F6" }}
                    />
                    {stage.stageName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-text-primary">{stage.count} Leads</span>
                    {index > 0 && (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {stage.conversionFromPrevious}% from prev
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-border/30 h-7 rounded-lg overflow-hidden relative flex items-center px-3">
                  <div
                    className="absolute left-0 top-0 bottom-0 rounded-lg transition-all duration-500 opacity-80"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: stage.color || "#3B82F6",
                    }}
                  />
                  <span className="relative z-10 text-[11px] font-bold text-white shadow-xs">
                    {stage.count} ({widthPct}%)
                  </span>
                </div>

                {index < funnel.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <ArrowDown size={12} className="text-text-muted opacity-50" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
