import React from 'react';
import { SwotAnalysis } from '../types';
import { ShieldCheck, Zap, AlertTriangle, Globe, Compass, TrendingUp } from 'lucide-react';

interface SwotViewProps {
  analysis: SwotAnalysis;
}

export const SwotView: React.FC<SwotViewProps> = ({ analysis }) => {
  const { title, summary, strengths, weaknesses, opportunities, threats, recommendation } = analysis;

  return (
    <div id="swot-analysis-container" className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Strategic Overview</h3>
        <p className="text-slate-700 text-sm leading-relaxed">{summary}</p>
      </div>

      {/* 2x2 SWOT Minimalist Grid Card */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">SWOT Strategic Matrix</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 text-sm">
          {/* Strengths */}
          <div className="p-6 border-b md:border-r border-slate-100 space-y-3">
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Strengths (Internal +)</span>
            <div className="space-y-3">
              {strengths.map((item, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="font-semibold text-slate-800 text-sm">{item.text}</h5>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="p-6 border-b border-slate-100 space-y-3">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Weaknesses (Internal -)</span>
            <div className="space-y-3">
              {weaknesses.map((item, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="font-semibold text-slate-800 text-sm">{item.text}</h5>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div className="p-6 md:border-r border-slate-100 md:border-b-0 border-b space-y-3">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Opportunities (External +)</span>
            <div className="space-y-3">
              {opportunities.map((item, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="font-semibold text-slate-800 text-sm">{item.text}</h5>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Threats */}
          <div className="p-6 space-y-3">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Threats (External -)</span>
            <div className="space-y-3">
              {threats.map((item, index) => (
                <div key={index} className="space-y-1">
                  <h5 className="font-semibold text-slate-800 text-sm">{item.text}</h5>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SWOT Recommendation Panel */}
      <div className="bg-slate-900 text-white rounded-lg p-6 border border-slate-900 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-slate-300">
          <Compass className="w-4 h-4 text-white" />
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-200">The Strategic SWOT Tiebreaker</h4>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{recommendation}</p>
        <div className="text-[10px] text-slate-400 pt-1 font-mono uppercase tracking-wider border-t border-slate-800">
          Note: SWOT maps internal forces against the external horizon. Match strengths to opportunities, while shielding weaknesses from threats.
        </div>
      </div>
    </div>
  );
};
