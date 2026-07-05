import React, { useMemo } from 'react';
import { ProsConsAnalysis, ProConItem } from '../types';
import { PlusCircle, MinusCircle, ShieldCheck, Scale, RefreshCw } from 'lucide-react';

interface ProsConsViewProps {
  analysis: ProsConsAnalysis;
  userWeights: { [itemId: string]: number };
  onWeightChange: (itemId: string, weight: number) => void;
  onResetWeights: () => void;
}

export const ProsConsView: React.FC<ProsConsViewProps> = ({
  analysis,
  userWeights,
  onWeightChange,
  onResetWeights,
}) => {
  const { pros, cons, summary, recommendation } = analysis;

  // Calculate live scores
  const prosWithCurrentWeights = useMemo(() => {
    return pros.map((p) => ({
      ...p,
      currentWeight: userWeights[p.id] !== undefined ? userWeights[p.id] : p.impact,
    }));
  }, [pros, userWeights]);

  const consWithCurrentWeights = useMemo(() => {
    return cons.map((c) => ({
      ...c,
      currentWeight: userWeights[c.id] !== undefined ? userWeights[c.id] : c.impact,
    }));
  }, [cons, userWeights]);

  const totalProsScore = useMemo(() => {
    return prosWithCurrentWeights.reduce((acc, p) => acc + p.currentWeight, 0);
  }, [prosWithCurrentWeights]);

  const totalConsScore = useMemo(() => {
    return consWithCurrentWeights.reduce((acc, c) => acc + c.currentWeight, 0);
  }, [consWithCurrentWeights]);

  const balanceScore = totalProsScore - totalConsScore;
  const maxPossible = Math.max(totalProsScore + totalConsScore, 1);
  const prosPercentage = Math.round((totalProsScore / maxPossible) * 100);
  const consPercentage = Math.round((totalConsScore / maxPossible) * 100);

  // Determine tilt color and label
  const tiltInfo = useMemo(() => {
    if (balanceScore > 0) {
      return {
        label: 'Tilted towards YES',
        sub: 'The positive aspects outweigh the drawbacks.',
        color: 'text-green-700 bg-green-50/50 border-green-200',
        barColor: 'bg-green-600',
        emoji: '➕',
      };
    } else if (balanceScore < 0) {
      return {
        label: 'Tilted towards NO',
        sub: 'The drawbacks and risks outweigh the positives.',
        color: 'text-red-700 bg-red-50/50 border-red-200',
        barColor: 'bg-red-600',
        emoji: '➖',
      };
    } else {
      return {
        label: 'Perfect Deadlock',
        sub: 'The scores are perfectly tied. Tweak the weights below!',
        color: 'text-slate-700 bg-slate-50 border-slate-200',
        barColor: 'bg-slate-500',
        emoji: '⚖️',
      };
    }
  }, [balanceScore]);

  const hasModifiedWeights = useMemo(() => {
    const allItems = [...pros, ...cons];
    return allItems.some((item) => userWeights[item.id] !== undefined && userWeights[item.id] !== item.impact);
  }, [pros, cons, userWeights]);

  return (
    <div id="pros-cons-analysis-container" className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Executive Summary</h3>
        <p className="text-slate-700 text-sm leading-relaxed">{summary}</p>
      </div>

      {/* Real-time Decision Scale Visualizer */}
      <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-900" />
            <h3 className="font-display font-semibold text-slate-800 text-md tracking-tight uppercase">Decision Balance</h3>
          </div>
          {hasModifiedWeights && (
            <button
              onClick={onResetWeights}
              className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-sm py-1 px-2.5 bg-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Weights</span>
            </button>
          )}
        </div>

        {/* Dynamic Scale Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            <span>PROS (Total: {totalProsScore})</span>
            <span>CONS (Total: {totalConsScore})</span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-sm overflow-hidden flex">
            <div
              className="bg-green-600 h-full transition-all duration-500 ease-out flex justify-end items-center pr-2 text-[10px] font-mono text-white font-bold"
              style={{ width: `${prosPercentage}%` }}
            >
              {prosPercentage > 15 && `${prosPercentage}%`}
            </div>
            <div
              className="bg-red-600 h-full transition-all duration-500 ease-out flex justify-start items-center pl-2 text-[10px] font-mono text-white font-bold"
              style={{ width: `${consPercentage}%` }}
            >
              {consPercentage > 15 && `${consPercentage}%`}
            </div>
          </div>

          {/* Tug of war visual pointer */}
          <div className="relative h-6 mt-1 flex items-center justify-center">
            <div className="absolute left-0 right-0 h-[1px] bg-slate-200"></div>
            {/* Standard zero line */}
            <div className="absolute left-1/2 w-[1px] h-4 bg-slate-400 -translate-x-1/2"></div>
            
            {/* Floating indicator */}
            <div
              className="absolute transition-all duration-500 ease-out flex flex-col items-center"
              style={{
                left: `calc(50% + ${Math.max(-45, Math.min(45, (balanceScore / maxPossible) * 50))}% - 12px)`,
              }}
            >
              <span className="text-xs select-none">▲</span>
            </div>
          </div>
        </div>

        {/* Live Recommendation Summary banner */}
        <div className={`p-4 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${tiltInfo.color} transition-all duration-300`}>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight">
              <span>{tiltInfo.emoji}</span>
              <span>{tiltInfo.label}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-sm bg-white/60 ml-2">
                Delta: {balanceScore > 0 ? `+${balanceScore}` : balanceScore}
              </span>
            </div>
            <p className="text-xs opacity-90 mt-1">{tiltInfo.sub}</p>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest py-1 px-2.5 rounded-sm bg-white/40 border border-slate-200/20 self-start sm:self-auto text-slate-600">
            Interactive
          </div>
        </div>
      </div>

      {/* Grid of Pros and Cons with Slider Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pros Section */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-green-600">Pros</h4>
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Positive Impact</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {prosWithCurrentWeights.map((pro) => (
              <div key={pro.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-sm border border-slate-100 hover:border-slate-300 transition-colors space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">
                      {pro.category}
                    </span>
                    <h5 className="font-semibold text-slate-800 text-sm mt-1.5">{pro.text}</h5>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-green-600">
                      +{pro.currentWeight}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{pro.details}</p>
                
                {/* Interactive Slider */}
                <div className="pt-2 flex items-center space-x-3">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Scale</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={pro.currentWeight}
                    onChange={(e) => onWeightChange(pro.id, parseInt(e.target.value, 10))}
                    className="w-full accent-slate-900 h-1 bg-slate-200 rounded-sm cursor-ew-resize"
                  />
                  <span className="text-[10px] font-mono text-slate-600 font-bold">{pro.currentWeight}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cons Section */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-red-600">Cons</h4>
            <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold uppercase">Negative Cost</span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {consWithCurrentWeights.map((con) => (
              <div key={con.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-sm border border-slate-100 hover:border-slate-300 transition-colors space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">
                      {con.category}
                    </span>
                    <h5 className="font-semibold text-slate-800 text-sm mt-1.5">{con.text}</h5>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-xs text-red-600">
                      -{con.currentWeight}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">{con.details}</p>

                {/* Interactive Slider */}
                <div className="pt-2 flex items-center space-x-3">
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Scale</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={con.currentWeight}
                    onChange={(e) => onWeightChange(con.id, parseInt(e.target.value, 10))}
                    className="w-full accent-slate-900 h-1 bg-slate-200 rounded-sm cursor-ew-resize"
                  />
                  <span className="text-[10px] font-mono text-slate-600 font-bold">{con.currentWeight}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendation Panel */}
      <div className="bg-slate-900 text-white rounded-lg p-6 border border-slate-900 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-white" />
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-200">The Tiebreaker AI Strategy</h4>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{recommendation}</p>
        <div className="text-[10px] text-slate-400 pt-1 font-mono uppercase tracking-wider">
          Note: Use the sliders above to model your personal values and see how the live balance scale tilts in real-time.
        </div>
      </div>
    </div>
  );
};
