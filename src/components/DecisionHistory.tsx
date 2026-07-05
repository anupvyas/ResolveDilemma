import React from 'react';
import { DecisionResult } from '../types';
import { Trash2, Calendar, Scale, Columns, Compass, Eye } from 'lucide-react';

interface DecisionHistoryProps {
  history: DecisionResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export const DecisionHistory: React.FC<DecisionHistoryProps> = ({
  history,
  selectedId,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'pros-cons':
        return <Scale className="w-3.5 h-3.5 text-slate-700" />;
      case 'comparison':
        return <Columns className="w-3.5 h-3.5 text-slate-700" />;
      case 'swot':
        return <Compass className="w-3.5 h-3.5 text-slate-700" />;
      default:
        return <Scale className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'pros-cons':
        return 'Pros & Cons';
      case 'comparison':
        return 'Comparison';
      case 'swot':
        return 'SWOT';
      default:
        return 'Analysis';
    }
  };

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center border border-slate-200 space-y-2">
        <Scale className="w-6 h-6 text-slate-400 mx-auto" />
        <h4 className="font-display font-semibold text-slate-700 text-xs uppercase tracking-wider">No history yet</h4>
        <p className="text-slate-400 text-xs leading-relaxed">Analyzed dilemmas will appear here for reference.</p>
      </div>
    );
  }

  return (
    <div id="decision-history-sidebar" className="space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Decisions</h3>
        <button
          onClick={onClearAll}
          className="text-xs text-red-600 hover:text-red-800 font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
        {history.map((item) => {
          const isSelected = selectedId === item.id;
          const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`p-4 rounded-sm border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'border-slate-900 bg-slate-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1 w-[85%]">
                  <div className="flex items-center gap-1.5">
                    {getIcon(item.type)}
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {getLabel(item.type)}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs truncate leading-tight group-hover:text-slate-950 transition-colors">
                    {item.prompt}
                  </h4>
                </div>

                <button
                  onClick={(e) => onDelete(item.id, e)}
                  className="p-1 rounded-sm text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                  title="Delete Dilemma"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100/60 pt-2 font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {dateStr}
                </span>
                <span className="flex items-center gap-0.5 font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-3 h-3" /> View
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
