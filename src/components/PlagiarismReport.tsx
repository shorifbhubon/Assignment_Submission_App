import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, FileSearch } from 'lucide-react';
import { checkPlagiarism, getPlagiarismReports } from '../lib/plagiarism';

interface PlagiarismReportProps {
  submissionId: string;
  assignmentId: string;
  submissionContent: string;
}

export function PlagiarismReport({ submissionId, assignmentId, submissionContent }: PlagiarismReportProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [highlightedContent, setHighlightedContent] = useState('');

  useEffect(() => {
    loadReports();
  }, [submissionId]);

  const loadReports = async () => {
    setLoading(true);
    const data = await getPlagiarismReports(submissionId);
    setReports(data);

    if (data.length > 0) {
      const maxScore = Math.max(...data.map((r: any) => r.similarity_score));
      setOverallScore(maxScore);
      highlightMatches(data);
    }

    setLoading(false);
  };

  const runPlagiarismCheck = async () => {
    setChecking(true);
    const result = await checkPlagiarism(submissionId, assignmentId);

    if (result.overallSimilarity !== undefined) {
      setOverallScore(result.overallSimilarity);
    }

    await loadReports();
    setChecking(false);
  };

  const highlightMatches = (reportData: any[]) => {
    let content = submissionContent;
    const segments: Array<{ start: number; end: number }> = [];

    reportData.forEach((report: any) => {
      if (report.matched_content && Array.isArray(report.matched_content)) {
        report.matched_content.forEach((match: any) => {
          if (match.startIndex !== undefined && match.endIndex !== undefined) {
            segments.push({ start: match.startIndex, end: match.endIndex });
          }
        });
      }
    });

    segments.sort((a, b) => a.start - b.start);

    let highlighted = '';
    let lastIndex = 0;

    segments.forEach((segment) => {
      highlighted += content.substring(lastIndex, segment.start);
      highlighted += `<mark class="bg-yellow-200 px-1">${content.substring(segment.start, segment.end)}</mark>`;
      lastIndex = segment.end;
    });

    highlighted += content.substring(lastIndex);
    setHighlightedContent(highlighted);
  };

  const getSeverityColor = (score: number) => {
    if (score < 20) return 'text-green-600';
    if (score < 40) return 'text-yellow-600';
    if (score < 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityBg = (score: number) => {
    if (score < 20) return 'bg-green-50 border-green-200';
    if (score < 40) return 'bg-yellow-50 border-yellow-200';
    if (score < 60) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileSearch className="w-5 h-5" />
          Plagiarism Check
        </h3>
        <button
          onClick={runPlagiarismCheck}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={checking}
        >
          {checking ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Checking...
            </>
          ) : (
            <>
              <FileSearch className="w-4 h-4" />
              Run Check
            </>
          )}
        </button>
      </div>

      {overallScore !== null && (
        <div className={`border rounded-lg p-6 ${getSeverityBg(overallScore)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {overallScore < 20 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              )}
              <div>
                <h4 className="font-semibold text-gray-900">Overall Similarity Score</h4>
                <p className="text-sm text-gray-600">
                  {overallScore < 20 && 'Low similarity - looks good!'}
                  {overallScore >= 20 && overallScore < 40 && 'Moderate similarity - review recommended'}
                  {overallScore >= 40 && overallScore < 60 && 'High similarity - investigation needed'}
                  {overallScore >= 60 && 'Very high similarity - significant concern'}
                </p>
              </div>
            </div>
            <div className={`text-4xl font-bold ${getSeverityColor(overallScore)}`}>
              {overallScore.toFixed(1)}%
            </div>
          </div>

          {reports.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 mb-2">Matched Submissions:</h5>
              <div className="space-y-2">
                {reports.map((report: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Student: {report.compared_submission?.student?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {report.compared_submission?.student?.email || ''}
                        </p>
                      </div>
                      <span className={`text-lg font-bold ${getSeverityColor(report.similarity_score)}`}>
                        {report.similarity_score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {highlightedContent && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Highlighted Matches</h4>
          <div
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
          />
          <p className="text-xs text-gray-600 mt-2">
            Yellow highlights indicate content that matches other submissions
          </p>
        </div>
      )}

      {reports.length === 0 && overallScore === null && (
        <div className="text-center py-8 text-gray-500">
          <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No plagiarism check has been run yet.</p>
          <p className="text-sm">Click "Run Check" to analyze this submission.</p>
        </div>
      )}
    </div>
  );
}
