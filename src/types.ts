export type DecisionType = 'pros-cons' | 'comparison' | 'swot';

export interface ProConItem {
  id: string;
  text: string;
  impact: number; // 1 to 5 (user can customize this weight dynamically on UI)
  category: string;
  details: string;
}

export interface ProsConsAnalysis {
  title: string;
  summary: string;
  pros: ProConItem[];
  cons: ProConItem[];
  recommendation: string;
}

export interface ComparisonRating {
  option: string;
  rating: number; // 1 to 5
  comment: string;
}

export interface ComparisonCriterion {
  id: string;
  name: string;
  description: string;
  ratings: ComparisonRating[];
}

export interface ComparisonAnalysis {
  title: string;
  summary: string;
  options: string[];
  criteria: ComparisonCriterion[];
  recommendation: string;
}

export interface SwotItem {
  text: string;
  details: string;
}

export interface SwotAnalysis {
  title: string;
  summary: string;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  recommendation: string;
}

export interface DecisionResult {
  id: string;
  type: DecisionType;
  prompt: string;
  context?: string;
  timestamp: string;
  analysis: ProsConsAnalysis | ComparisonAnalysis | SwotAnalysis;
  userScores?: {
    // Allows user to custom-adjust scores/weights on the frontend
    weights: { [itemId: string]: number };
  };
}
