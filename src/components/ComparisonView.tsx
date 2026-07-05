import React, { useMemo } from 'react';
import { ComparisonAnalysis, ComparisonCriterion } from '../types';
import { Star, Award, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface ComparisonViewProps {
  analysis: ComparisonAnalysis;
  userWeights: { [ratingKey: string]: number }; // Keys are in the form 'critId_optionName'
  onWeightChange: (ratingKey: string, rating: number) => void;
  onResetWeights: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  analysis,
  userWeights,
  onWeightChange,
  onResetWeights,
}) => {
  const { title, summary, options, criteria, recommendation } = analysis;

  // Live score compilation
  const dynamicScores = useMemo(() => {
    // Initialize option sums
    const optionTotals: { [option: string]: { sum: number; count: number } } = {};
    options.forEach((opt) => {
      optionTotals[opt] = { sum: 0, count: 0 };
    });

    criteria.forEach((crit) => {
      crit.ratings.forEach((rat) => {
        const ratingKey = `${crit.id}_${rat.option}`;
        const currentRating = userWeights[ratingKey] !== undefined ? userWeights[ratingKey] : rat.rating;
        
        if (optionTotals[rat.option]) {
          optionTotals[rat.option].sum += currentRating;
          optionTotals[rat.option].count += 1;
        }
      });
    });

    const scores: { option: string; average: number }[] = [];
    options.forEach((opt) => {
      const stats = optionTotals[opt];
      scores.push({
        option: opt,
        average: stats.count > 0 ? parseFloat((stats.sum / stats.count).toFixed(2)) : 0,
      });
    });

    // Sort scores to find the winner
    const sorted = [...scores].sort((a, b) => b.average - a.average);
    const winner = sorted[0]?.average > sorted[1]?.average ? sorted[0].option : null;
    const isTie = sorted[0]?.average === sorted[1]?.average;

    return {
      scoresMap: optionTotals,
      averages: scores,
      sorted,
      winner,
      isTie,
    };
  }, [options, criteria, userWeights]);

  const hasModifiedWeights = useMemo(() => {
    return Object.keys(userWeights).length > 0;
  }, [userWeights]);

  return (
    <div id="comparison-analysis-container" className="space-y-6">
      {/* Executive Summary */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Executive Summary</h3>
        <p className="text-slate-700 text-sm leading-relaxed">{summary}</p>
      </div>

      {/* Dynamic Scoreboards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {dynamicScores.averages.map((score, index) => {
          const isCurrentWinner = dynamicScores.winner === score.option;
          return (
            <div
              key={score.option}
              className={`p-4 rounded-lg border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isCurrentWinner
                  ? 'border-slate-900 bg-slate-50 shadow-sm'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {isCurrentWinner && (
                <div className="absolute top-3 right-3 bg-slate-900 text-white rounded-xs p-1">
                  <Award className="w-3.5 h-3.5" />
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Option {index + 1}
                </span>
                <h4 className="font-semibold text-slate-800 text-sm truncate mt-0.5 pr-6">
                  {score.option}
                </h4>
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold text-slate-900">{score.average}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">/ 5.0 avg</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-xs mt-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ease-out ${
                    isCurrentWinner ? 'bg-slate-900' : 'bg-slate-400'
                  }`}
                  style={{ width: `${(score.average / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Matrix Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-900" />
            <h3 className="font-display font-semibold text-slate-800 text-sm tracking-tight uppercase">Dimension Trade-offs</h3>
          </div>
          {hasModifiedWeights && (
            <button
              onClick={onResetWeights}
              className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-sm py-1 px-2.5 bg-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Ratings</span>
            </button>
          )}
        </div>

        {/* Responsive Matrix Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3.5 px-6 w-1/3 font-bold">Metric Dimension</th>
                {options.map((opt) => (
                  <th key={opt} className="py-3.5 px-6 text-center font-bold">
                    {opt}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {criteria.map((crit) => (
                <tr key={crit.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Criterion Info */}
                  <td className="py-5 px-6">
                    <h5 className="font-semibold text-slate-800 text-sm">{crit.name}</h5>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">{crit.description}</p>
                  </td>

                  {/* Options Scoring Column */}
                  {options.map((opt) => {
                    const ratingKey = `${crit.id}_${opt}`;
                    const originalRating = crit.ratings.find((r) => r.option === opt);
                    const currentRating = userWeights[ratingKey] !== undefined ? userWeights[ratingKey] : (originalRating?.rating || 3);
                    const comment = originalRating?.comment || '';

                    return (
                      <td key={opt} className="py-5 px-6 text-center align-top w-[30%]">
                        <div className="flex flex-col items-center space-y-1">
                          {/* Star Interactive Controls */}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => onWeightChange(ratingKey, star)}
                                className="focus:outline-hidden group cursor-pointer transition-all hover:scale-110"
                                title={`Rate ${star} / 5`}
                              >
                                <Star
                                  className={`w-4 h-4 ${
                                    star <= currentRating
                                      ? 'text-slate-900 fill-slate-900'
                                      : 'text-slate-200 fill-transparent group-hover:text-slate-400'
                                  } transition-colors`}
                                />
                              </button>
                            ))}
                          </div>
                          
                          {/* Display score */}
                          <span className="text-[10px] font-mono font-bold text-slate-400 mt-1">
                            Rating: {currentRating}/5
                          </span>
                          
                          {/* Explanation details */}
                          {comment && (
                            <p className="text-xs text-slate-500 mt-2 max-w-[200px] text-center leading-relaxed">
                              {comment}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Recommendation Output Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-6 border border-slate-900 shadow-sm space-y-3">
        <div className="flex items-center space-x-2 text-slate-300">
          <Award className="w-4 h-4 text-white" />
          <h4 className="font-display font-bold text-xs uppercase tracking-widest text-slate-200">Decision Outcome</h4>
        </div>
        
        {dynamicScores.winner ? (
          <p className="text-sm font-medium text-slate-200">
            🥇 Based on ratings, <span className="font-bold underline text-white">{dynamicScores.winner}</span> leads with an average of {dynamicScores.sorted[0].average} / 5.0!
          </p>
        ) : dynamicScores.isTie ? (
          <p className="text-sm font-medium text-slate-200">
            ⚖️ Perfect deadlock. Adjust rating stars in the grid above to break the tie.
          </p>
        ) : null}

        <p className="text-slate-300 text-sm leading-relaxed pt-1">{recommendation}</p>
        
        <div className="text-[10px] text-slate-400 pt-1 font-mono uppercase tracking-wider border-t border-slate-800">
          Note: This report is fully interactive. Adjust ratings on the fly to re-model stats instantly.
        </div>
      </div>
    </div>
  );
};
