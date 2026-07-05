import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Sparkles, 
  Share2, 
  Download, 
  FileText, 
  AlertCircle, 
  Loader2, 
  History, 
  Lightbulb, 
  ChevronRight, 
  ExternalLink 
} from 'lucide-react';
import { DecisionType, DecisionResult, ProsConsAnalysis, ComparisonAnalysis, SwotAnalysis } from './types';
import { ProsConsView } from './components/ProsConsView';
import { ComparisonView } from './components/ComparisonView';
import { SwotView } from './components/SwotView';
import { DecisionHistory } from './components/DecisionHistory';

const LOADING_PHRASES = [
  "Gathering trade-offs and options...",
  "Evaluating long-term tactical impact...",
  "Mapping criteria, opportunities, and strategic risks...",
  "Synthesizing the Tiebreaker AI strategy...",
  "Weighing qualitative outcomes...",
  "Structuring comparison matrix..."
];

export default function App() {
  // Primary inputs
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [type, setType] = useState<DecisionType>('pros-cons');

  // UI / Async State
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // History & Selected State
  const [history, setHistory] = useState<DecisionResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('the_tiebreaker_history');
      if (stored) {
        const parsed = JSON.parse(stored) as DecisionResult[];
        setHistory(parsed);
        if (parsed.length > 0) {
          setSelectedId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to read localStorage history:", e);
    }
  }, []);

  // Sync history to localStorage
  const saveHistory = (newHistory: DecisionResult[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('the_tiebreaker_history', JSON.stringify(newHistory));
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
  };

  // Rotating loading phrases
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2500);
    } else {
      setLoadingPhraseIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Selected dilemma
  const selectedDilemma = useMemo(() => {
    return history.find((h) => h.id === selectedId) || null;
  }, [history, selectedId]);

  // Handler for custom weight tweaks on the client
  const handleWeightChange = (itemId: string, value: number) => {
    if (!selectedId) return;
    const updatedHistory = history.map((item) => {
      if (item.id === selectedId) {
        const currentWeights = item.userScores?.weights || {};
        return {
          ...item,
          userScores: {
            weights: {
              ...currentWeights,
              [itemId]: value,
            },
          },
        };
      }
      return item;
    });
    saveHistory(updatedHistory);
  };

  // Handler to reset customized weights back to AI default values
  const handleResetWeights = () => {
    if (!selectedId) return;
    const updatedHistory = history.map((item) => {
      if (item.id === selectedId) {
        return {
          ...item,
          userScores: { weights: {} },
        };
      }
      return item;
    });
    saveHistory(updatedHistory);
  };

  // Preset Dilemmas
  const handleApplyPreset = (presetPrompt: string, presetContext: string, presetType: DecisionType) => {
    setPrompt(presetPrompt);
    setContext(presetContext);
    setType(presetType);
    
    // Smooth scroll to top of form
    const formElement = document.getElementById('dilemma-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Call API to analyze decision
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please specify the decision you need to make.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/decide", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          prompt,
          context,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to analyze decision.");
      }

      const newResult: DecisionResult = {
        id: `dec_${Date.now()}`,
        type,
        prompt,
        context,
        timestamp: new Date().toISOString(),
        analysis: result.data,
        userScores: { weights: {} },
      };

      const updatedHistory = [newResult, ...history];
      saveHistory(updatedHistory);
      setSelectedId(newResult.id);
      setSuccessMessage("Dilemma successfully resolved!");

      // Clear main input after success, leaving context or setting defaults
      setPrompt('');
      setContext('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while analyzing your dilemma. Please verify server connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  // Selection & deletion operations
  const handleSelectDilemma = (id: string) => {
    setSelectedId(id);
    setSuccessMessage(null);
    setError(null);
  };

  const handleDeleteDilemma = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    saveHistory(updated);
    
    // Re-route selection
    if (selectedId === id) {
      setSelectedId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire decision history? This cannot be undone.")) {
      saveHistory([]);
      setSelectedId(null);
    }
  };

  // Export functions
  const handleCopyToClipboard = () => {
    if (!selectedDilemma) return;
    try {
      const text = generateMarkdownReport(selectedDilemma);
      navigator.clipboard.writeText(text);
      alert("Analysis copied to clipboard as elegant markdown!");
    } catch (err) {
      console.error(err);
      alert("Failed to copy. Please copy the text manually.");
    }
  };

  const handleDownloadJSON = () => {
    if (!selectedDilemma) return;
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedDilemma, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `tiebreaker_${selectedDilemma.type}_${selectedDilemma.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export JSON report.");
    }
  };

  // Generator helper to compile plain text / markdown for reporting
  const generateMarkdownReport = (dilemma: DecisionResult): string => {
    const { prompt, context, type, analysis } = dilemma;
    let report = `# The Tiebreaker AI Decision Report\n\n`;
    report += `**Dilemma**: ${prompt}\n`;
    if (context) report += `**Context**: ${context}\n`;
    report += `**Type**: ${type.toUpperCase()}\n`;
    report += `**Generated At**: ${new Date(dilemma.timestamp).toLocaleString()}\n\n`;
    report += `--- \n\n`;
    report += `## Executive Overview\n${analysis.summary}\n\n`;

    if (type === 'pros-cons') {
      const pc = analysis as ProsConsAnalysis;
      report += `## Advantages (Pros)\n`;
      pc.pros.forEach((p) => {
        report += `- **${p.text}** (Initial Impact: ${p.impact}/5, Category: ${p.category})\n  *${p.details}*\n`;
      });
      report += `\n## Disadvantages (Cons)\n`;
      pc.cons.forEach((c) => {
        report += `- **${c.text}** (Initial Impact: ${c.impact}/5, Category: ${c.category})\n  *${c.details}*\n`;
      });
    } else if (type === 'comparison') {
      const comp = analysis as ComparisonAnalysis;
      report += `## Comparison Matrix\n`;
      report += `Options: ${comp.options.join(" vs ")}\n\n`;
      comp.criteria.forEach((crit) => {
        report += `### Criterion: ${crit.name}\n${crit.description}\n`;
        crit.ratings.forEach((rat) => {
          report += `- **${rat.option}**: ${rat.rating}/5 stars - _"${rat.comment}"_\n`;
        });
        report += `\n`;
      });
    } else {
      const sw = analysis as SwotAnalysis;
      report += `## SWOT grid\n\n`;
      report += `### Strengths\n`;
      sw.strengths.forEach((s) => report += `- **${s.text}**: ${s.details}\n`);
      report += `\n### Weaknesses\n`;
      sw.weaknesses.forEach((w) => report += `- **${w.text}**: ${w.details}\n`);
      report += `\n### Opportunities\n`;
      sw.opportunities.forEach((o) => report += `- **${o.text}**: ${o.details}\n`);
      report += `\n### Threats\n`;
      sw.threats.forEach((t) => report += `- **${t.text}**: ${t.details}\n`);
    }

    report += `\n## Strategy & Tiebreaking Advice\n${analysis.recommendation}\n\n`;
    report += `*Generated via Resolve Your Dilemma.*`;
    return report;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-40 h-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-xs flex items-center justify-center relative shrink-0">
              <div className="w-4 h-[2px] bg-white rotate-45 translate-y-[1px]"></div>
              <div className="w-4 h-[2px] bg-white -rotate-45 -translate-y-[1px] absolute"></div>
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-slate-800 uppercase font-display">RESOLVE YOUR DILEMMA</h1>
              <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">AI Decision Analyst</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              <span>Gemini 3.5</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form & History (5/12 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Dilemma Form */}
            <div id="dilemma-form" className="bg-white border border-slate-200 p-6 rounded-lg shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-1">
                <Sparkles className="w-4 h-4 text-slate-900 shrink-0" />
                <h2 className="font-display font-bold text-sm tracking-tight text-slate-800 uppercase">Input New Dilemma</h2>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-4">
                {/* Decision input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Your dilemma or question</label>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Accept the senior design offer in Seattle, or stay in my remote staff role?"
                    className="w-full text-sm bg-white border border-slate-200 focus:border-slate-900 rounded-sm p-3 transition-all outline-hidden resize-none placeholder:text-slate-400 font-sans"
                    required
                  />
                </div>

                {/* Optional Context input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Context & parameters (Optional)</label>
                  <textarea
                    rows={3}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g. Seattle offers a 35% salary increase, but rent is 22% higher. I value design culture and daily happiness."
                    className="w-full text-sm bg-white border border-slate-200 focus:border-slate-900 rounded-sm p-3 transition-all outline-hidden resize-none placeholder:text-slate-400 font-sans"
                  />
                </div>

                {/* Analysis Type */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select framework</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('pros-cons')}
                      className={`py-2 px-1 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                        type === 'pros-cons'
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      Pros & Cons
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('comparison')}
                      className={`py-2 px-1 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                        type === 'comparison'
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      Comparison
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('swot')}
                      className={`py-2 px-1 rounded-sm text-xs font-semibold border transition-all cursor-pointer ${
                        type === 'swot'
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      SWOT
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-sm transition-all font-display text-xs tracking-wider uppercase flex justify-center items-center gap-2 shadow-sm cursor-pointer disabled:bg-slate-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{LOADING_PHRASES[loadingPhraseIndex]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                      <span>Analyze Dilemma</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-sm text-xs flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Analysis Failed</span>
                    {error}
                  </div>
                </div>
              )}
            </div>

            {/* Test Presets Panel */}
            <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-slate-700">
                <Lightbulb className="w-4 h-4 text-slate-900" />
                <h3 className="font-display font-bold text-xs tracking-widest uppercase text-slate-400">Templates</h3>
              </div>
              
              <div className="space-y-2 text-xs text-left">
                {/* Preset 1 */}
                <button
                  onClick={() => handleApplyPreset(
                    "Should I quit my corporate marketing job to open a boutique artisan bakery?",
                    "I have 8 years of corporate marketing experience and $40,000 in personal savings. I love baking, but it requires waking up at 4:00 AM, and I don't have business management background. I value daily happiness and independence.",
                    "pros-cons"
                  )}
                  className="w-full p-3 rounded-sm border border-slate-200 hover:border-slate-400 bg-white text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Pros & Cons List</span>
                    <h4 className="font-semibold text-slate-800 leading-tight">Corporate Job vs. Artisan Bakery</h4>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </button>

                {/* Preset 2 */}
                <button
                  onClick={() => handleApplyPreset(
                    "Which electric vehicle should I buy: Tesla Model Y, Hyundai Ioniq 5, or Honda CR-V Hybrid?",
                    "My budget is $45,000. I commute 40 miles daily and take weekend camping trips. Need good trunk space and easy charging. I value autopilot tech, road trip efficiency, and reliability.",
                    "comparison"
                  )}
                  className="w-full p-3 rounded-sm border border-slate-200 hover:border-slate-400 bg-white text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Comparison Matrix</span>
                    <h4 className="font-semibold text-slate-800 leading-tight">Tesla Model Y vs. Ioniq 5 vs. CR-V</h4>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </button>

                {/* Preset 3 */}
                <button
                  onClick={() => handleApplyPreset(
                    "Should our 15-person software startup transition to a completely remote-first work model?",
                    "Our office lease expires in 2 months. We are spending $6,000/mo on rent. Employees are split: some love working from home, others miss whiteboard collaboration and social lunches. Value cash runway and talent recruiting.",
                    "swot"
                  )}
                  className="w-full p-3 rounded-sm border border-slate-200 hover:border-slate-400 bg-white text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400">SWOT Strategic</span>
                    <h4 className="font-semibold text-slate-800 leading-tight">Startup Going Fully Remote</h4>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                </button>
              </div>
            </div>

            {/* Local History sidebar */}
            <DecisionHistory
              history={history}
              selectedId={selectedId}
              onSelect={handleSelectDilemma}
              onDelete={handleDeleteDilemma}
              onClearAll={handleClearAllHistory}
            />

          </div>

          {/* Right Column: Display Stage (7/12 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {selectedDilemma ? (
              <div className="space-y-6">
                
                {/* Active Dilemma Header */}
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Active Analysis
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(selectedDilemma.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <h2 className="font-display font-semibold text-xl tracking-tight text-slate-900 leading-tight">
                      {selectedDilemma.prompt}
                    </h2>
                    {selectedDilemma.context && (
                      <p className="text-xs text-slate-500 italic leading-relaxed">
                        Context: {selectedDilemma.context}
                      </p>
                    )}
                  </div>

                  {/* Actions (Export, Print) */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                      onClick={handleCopyToClipboard}
                      className="p-2 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
                      title="Copy Markdown Report"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownloadJSON}
                      className="p-2 rounded border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 transition-all cursor-pointer"
                      title="Export JSON File"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Framework rendering block */}
                {selectedDilemma.type === 'pros-cons' && (
                  <ProsConsView
                    analysis={selectedDilemma.analysis as ProsConsAnalysis}
                    userWeights={selectedDilemma.userScores?.weights || {}}
                    onWeightChange={handleWeightChange}
                    onResetWeights={handleResetWeights}
                  />
                )}

                {selectedDilemma.type === 'comparison' && (
                  <ComparisonView
                    analysis={selectedDilemma.analysis as ComparisonAnalysis}
                    userWeights={selectedDilemma.userScores?.weights || {}}
                    onWeightChange={handleWeightChange}
                    onResetWeights={handleResetWeights}
                  />
                )}

                {selectedDilemma.type === 'swot' && (
                  <SwotView
                    analysis={selectedDilemma.analysis as SwotAnalysis}
                  />
                )}

              </div>
            ) : (
              /* Landing state when no decision is loaded */
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-xs flex flex-col items-center justify-center min-h-[500px] space-y-6">
                <div className="relative">
                  <div className="bg-slate-900 text-white p-4 rounded-sm relative z-10">
                    <Scale className="w-8 h-8" />
                  </div>
                </div>

                <div className="max-w-md space-y-2">
                  <h3 className="font-display font-semibold text-lg tracking-tight text-slate-900">Resolve Your Decision Matrix</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-sans">
                    Welcome to **Resolve Your Dilemma**. Describe any complex personal or professional decision on the left side, select a framework, and let Gemini compile structural options, weightings, and strategic advice in real-time.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 w-full max-w-sm text-center">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-widest">How to start</span>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-2">
                    <span>✍️ Type dilemma</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span>⚡ Pick layout</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span>⚖️ Tweak weights</span>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-xs font-medium text-slate-400 uppercase tracking-widest">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
          <div>Powered by Resolve Your Dilemma v2.4</div>
          <div className="flex gap-6">
            <span>Powered by Gemini 3.5</span>
            <span>•</span>
            <span className="text-slate-900 font-bold">Analysis ID: TB-90412</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
