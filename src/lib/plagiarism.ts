import { supabase } from './supabase';

interface MatchedSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  matchedSubmissionId: string;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return (intersection.size / union.size) * 100;
}

function findMatchingSegments(
  originalText: string,
  comparedText: string,
  comparedSubmissionId: string,
  threshold: number = 70
): MatchedSegment[] {
  const matches: MatchedSegment[] = [];
  const originalSentences = splitIntoSentences(originalText);
  const comparedSentences = splitIntoSentences(comparedText);

  for (const sentence of originalSentences) {
    const normalizedSentence = normalizeText(sentence);

    for (const comparedSentence of comparedSentences) {
      const normalizedCompared = normalizeText(comparedSentence);
      const similarity = calculateSimilarity(normalizedSentence, normalizedCompared);

      if (similarity >= threshold) {
        const startIndex = originalText.indexOf(sentence);
        if (startIndex !== -1) {
          matches.push({
            text: sentence,
            startIndex,
            endIndex: startIndex + sentence.length,
            matchedSubmissionId: comparedSubmissionId,
          });
        }
      }
    }
  }

  return matches;
}

function mergeOverlappingSegments(segments: MatchedSegment[]): MatchedSegment[] {
  if (segments.length === 0) return [];

  const sorted = [...segments].sort((a, b) => a.startIndex - b.startIndex);
  const merged: MatchedSegment[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.startIndex <= last.endIndex) {
      last.endIndex = Math.max(last.endIndex, current.endIndex);
      last.text = last.text + ' ' + current.text;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

export async function checkPlagiarism(submissionId: string, assignmentId: string) {
  const { data: currentSubmission } = await supabase
    .from('submissions')
    .select('content')
    .eq('id', submissionId)
    .single();

  if (!currentSubmission || !currentSubmission.content) {
    return { error: 'Submission not found or empty' };
  }

  const { data: otherSubmissions } = await supabase
    .from('submissions')
    .select('id, content')
    .eq('assignment_id', assignmentId)
    .neq('id', submissionId)
    .eq('status', 'submitted');

  if (!otherSubmissions || otherSubmissions.length === 0) {
    return {
      overallSimilarity: 0,
      reports: [],
      message: 'No other submissions to compare against',
    };
  }

  const allMatchedSegments: MatchedSegment[] = [];
  const reports = [];

  for (const otherSubmission of otherSubmissions) {
    if (!otherSubmission.content) continue;

    const matches = findMatchingSegments(
      currentSubmission.content,
      otherSubmission.content,
      otherSubmission.id
    );

    if (matches.length > 0) {
      allMatchedSegments.push(...matches);

      const totalMatchedChars = matches.reduce((sum, m) => sum + (m.endIndex - m.startIndex), 0);
      const similarity = (totalMatchedChars / currentSubmission.content.length) * 100;

      reports.push({
        compared_submission_id: otherSubmission.id,
        similarity_score: Math.round(similarity * 100) / 100,
        matched_content: matches,
      });

      await supabase.from('plagiarism_reports').insert({
        submission_id: submissionId,
        compared_submission_id: otherSubmission.id,
        similarity_score: Math.round(similarity * 100) / 100,
        matched_content: matches,
      });
    }
  }

  const mergedSegments = mergeOverlappingSegments(allMatchedSegments);
  const totalMatchedChars = mergedSegments.reduce((sum, m) => sum + (m.endIndex - m.startIndex), 0);
  const overallSimilarity = (totalMatchedChars / currentSubmission.content.length) * 100;

  return {
    overallSimilarity: Math.round(overallSimilarity * 100) / 100,
    reports: reports.sort((a, b) => b.similarity_score - a.similarity_score),
    matchedSegments: mergedSegments,
  };
}

export async function getPlagiarismReports(submissionId: string) {
  const { data } = await supabase
    .from('plagiarism_reports')
    .select(`
      *,
      compared_submission:submissions!plagiarism_reports_compared_submission_id_fkey(
        id,
        student:profiles(full_name, email)
      )
    `)
    .eq('submission_id', submissionId)
    .order('similarity_score', { ascending: false });

  return data || [];
}
