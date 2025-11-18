import React from 'react';

interface ComplexityMetrics {
  cyclomatic_complexity: number;
  max_nesting_depth: number;
  function_length: number;
  comment_lines: number;
}

interface QualityIssue {
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info';
  category: 'style' | 'complexity' | 'security' | 'best-practice';
  message: string;
  code?: string;
}

interface CodeQualityData {
  qualityScore: number;
  complexityMetrics: ComplexityMetrics;
  styleIssues: QualityIssue[];
  securityWarnings: QualityIssue[];
}

interface CodeQualityReportProps {
  codeQuality: CodeQualityData;
}

const CodeQualityReport: React.FC<CodeQualityReportProps> = ({ codeQuality }) => {
  if (!codeQuality || codeQuality.qualityScore === null) {
    return null;
  }

  const { qualityScore, complexityMetrics, styleIssues = [], securityWarnings = [] } = codeQuality;

  // Calculate individual component scores
  const complexityScore = calculateComplexityScore(complexityMetrics);
  const styleScore = calculateStyleScore(styleIssues);
  const securityScore = calculateSecurityScore(securityWarnings);

  return (
    <div className="mt-6">
      <div className="border-4 border-black bg-yellow-300 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">
          📊 Code Quality Report
        </h2>

        {/* Overall Score - Big and Bold */}
        <div className="border-4 border-black bg-white p-6 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-2xl uppercase">Quality Score</span>
            <span className="font-black text-5xl">{qualityScore}/100</span>
          </div>
          {/* Progress Bar - Sharp corners, thick borders */}
          <div className="w-full h-10 border-4 border-black bg-white overflow-hidden">
            <div
              className={`h-full border-r-4 border-black transition-all duration-300 ${
                qualityScore >= 80 ? 'bg-lime-400' : qualityScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid - Asymmetric Neo Brutalism Layout */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MetricCard
            title="Complexity"
            value={complexityMetrics.cyclomatic_complexity}
            max={10}
            color="bg-cyan-300"
            icon="🔍"
          />
          <MetricCard
            title="Nesting Depth"
            value={complexityMetrics.max_nesting_depth}
            max={5}
            color="bg-pink-300"
            icon="📐"
          />
          <MetricCard
            title="Code Length"
            value={complexityMetrics.function_length}
            max={50}
            color="bg-lime-300"
            icon="📏"
            unit="lines"
          />
          <MetricCard
            title="Comments"
            value={complexityMetrics.comment_lines}
            max={10}
            color="bg-purple-300"
            icon="💬"
            unit="lines"
          />
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <ScoreCard title="Complexity" score={complexityScore} color="bg-cyan-200" />
          <ScoreCard title="Style" score={styleScore} color="bg-pink-200" />
          <ScoreCard title="Security" score={securityScore} color="bg-lime-200" />
        </div>

        {/* Issues Section */}
        {(styleIssues.length > 0 || securityWarnings.length > 0) && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2">
              ⚠️ Issues Found
            </h3>

            {/* Security Warnings - Highest Priority */}
            {securityWarnings.length > 0 && (
              <div className="border-4 border-black bg-red-200 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xl mb-3 uppercase">🔒 Security Warnings</h4>
                <div className="space-y-2">
                  {securityWarnings.map((issue, index) => (
                    <IssueCard key={index} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {/* Style Issues */}
            {styleIssues.filter(i => i.severity === 'error' || i.severity === 'warning').length > 0 && (
              <div className="border-4 border-black bg-orange-200 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <h4 className="font-black text-xl mb-3 uppercase">✏️ Style Issues</h4>
                <div className="space-y-2">
                  {styleIssues
                    .filter(i => i.severity === 'error' || i.severity === 'warning')
                    .slice(0, 5)
                    .map((issue, index) => (
                      <IssueCard key={index} issue={issue} />
                    ))}
                  {styleIssues.filter(i => i.severity === 'error' || i.severity === 'warning').length > 5 && (
                    <p className="text-sm font-bold mt-2">
                      ... and {styleIssues.filter(i => i.severity === 'error' || i.severity === 'warning').length - 5} more issues
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Issues - Celebrate! */}
        {styleIssues.length === 0 && securityWarnings.length === 0 && (
          <div className="border-4 border-black bg-lime-200 p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-4xl">🎉</span>
            <p className="font-black text-xl uppercase mt-2">No Issues Found!</p>
            <p className="font-bold">Your code looks great!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components

interface MetricCardProps {
  title: string;
  value: number;
  max: number;
  color: string;
  icon: string;
  unit?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, max, color, icon, unit = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const isGood = value <= max;

  return (
    <div className={`border-4 border-black ${color} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-black text-lg uppercase">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-black text-3xl">{value}</span>
        {unit && <span className="font-bold text-sm">{unit}</span>}
      </div>
      <div className="w-full h-4 border-2 border-black bg-white">
        <div
          className={`h-full ${isGood ? 'bg-lime-400' : 'bg-red-400'} border-r-2 border-black transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface ScoreCardProps {
  title: string;
  score: number;
  color: string;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, color }) => {
  return (
    <div className={`border-4 border-black ${color} p-4 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
      <p className="font-black text-sm uppercase mb-2">{title}</p>
      <p className="font-black text-4xl">{score}</p>
      <p className="font-bold text-xs mt-1">/100</p>
    </div>
  );
};

interface IssueCardProps {
  issue: QualityIssue;
}

const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const severityColor = {
    error: 'bg-red-300',
    warning: 'bg-yellow-300',
    info: 'bg-blue-300',
  }[issue.severity];

  const severityIcon = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[issue.severity];

  return (
    <div className={`border-3 border-black ${severityColor} p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{severityIcon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-black text-xs uppercase bg-white border-2 border-black px-2 py-0.5">
              Line {issue.line}
            </span>
            {issue.code && (
              <span className="font-bold text-xs bg-white border-2 border-black px-2 py-0.5">
                {issue.code}
              </span>
            )}
          </div>
          <p className="font-bold text-sm">{issue.message}</p>
        </div>
      </div>
    </div>
  );
};

// Scoring Helper Functions

function calculateComplexityScore(metrics: ComplexityMetrics): number {
  let score = 100;
  if (metrics.cyclomatic_complexity > 10) {
    score -= (metrics.cyclomatic_complexity - 10) * 5;
  }
  if (metrics.max_nesting_depth > 3) {
    score -= (metrics.max_nesting_depth - 3) * 10;
  }
  if (metrics.function_length > 50) {
    score -= Math.floor((metrics.function_length - 50) / 5);
  }
  return Math.max(0, score);
}

function calculateStyleScore(issues: QualityIssue[]): number {
  let score = 100;
  const styleIssues = issues.filter(i => i.category === 'style');
  const errors = styleIssues.filter(i => i.severity === 'error').length;
  const warnings = styleIssues.filter(i => i.severity === 'warning').length;
  score -= errors * 10;
  score -= warnings * 3;
  return Math.max(0, score);
}

function calculateSecurityScore(warnings: QualityIssue[]): number {
  let score = 100;
  for (const warning of warnings) {
    if (warning.severity === 'error') {
      score -= 25;
    } else if (warning.severity === 'warning') {
      score -= 15;
    } else {
      score -= 5;
    }
  }
  return Math.max(0, score);
}

export default CodeQualityReport;
