import React from 'react';
import { FileText, CheckCircle2, Download } from 'lucide-react';

export const ResearchPage: React.FC = () => {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-[#68736E]">Research & Methodology</span>
          <h1 className="text-2xl font-bold text-[#18221F] mt-1">Data Sources, Provenance & Validation</h1>
        </div>
        <button
          onClick={() => alert('Exporting technical research summary JSON and PDF report...')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#326B58] text-white hover:bg-[#285545] transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Research Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-[#18221F]">Data Sources</h2>
          <div className="space-y-3">
            {[
              { name: 'OpenStreetMap', role: 'Road network topology and building footprints' },
              { name: 'Copernicus DEM', role: 'High-resolution digital elevation models (30m)' },
              { name: 'IMD Meteorological Archives', role: 'Historical cloudburst and rainfall intensity distributions' },
            ].map((src, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F7F8F6] border border-[#E4E8E3] space-y-1">
                <div className="text-sm font-bold text-[#18221F]">{src.name}</div>
                <p className="text-xs text-[#68736E]">{src.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E4E8E3] shadow-xs space-y-4">
          <h2 className="text-base font-semibold text-[#18221F]">Simulated vs Live Distinction</h2>
          <p className="text-xs text-[#68736E] leading-relaxed">
            TIDELINE clearly separates live observational telemetry from synthetic hydrological simulation models. All flood propagation and bridge failure outputs are calculated deterministically using graph algorithms rather than empirical guesswork.
          </p>
          <div className="p-4 rounded-xl bg-[#F0F2EF] border border-[#E4E8E3] space-y-2">
            <div className="text-xs font-semibold text-[#18221F]">Verification Status</div>
            <div className="flex items-center gap-2 text-xs text-[#326B58]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tested against historical urban flood testbeds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
