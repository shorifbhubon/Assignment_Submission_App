import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookOpen, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  courses: { title: string };
};

type Submission = Database['public']['Tables']['submissions']['Row'];

export function StudentDashboard() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile) return;

    const [assignmentsResult, submissionsResult] = await Promise.all([
      supabase
        .from('assignments')
        .select(`
          *,
          courses (title)
        `)
        .order('due_date', { ascending: true }),
      supabase
        .from('submissions')
        .select('*')
        .eq('student_id', profile.id)
    ]);

    if (assignmentsResult.data) setAssignments(assignmentsResult.data);
    if (submissionsResult.data) setSubmissions(submissionsResult.data);

    setLoading(false);
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(s => s.assignment_id === assignmentId);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getAssignmentStats = () => {
    const total = assignments.length;
    const completed = assignments.filter(a => {
      const sub = getSubmissionForAssignment(a.id);
      return sub && sub.status === 'submitted' || sub?.status === 'graded';
    }).length;
    const pending = assignments.filter(a => {
      const sub = getSubmissionForAssignment(a.id);
      return !sub || sub.status === 'draft';
    }).length;
    const graded = assignments.filter(a => {
      const sub = getSubmissionForAssignment(a.id);
      return sub && sub.status === 'graded';
    }).length;

    return { total, completed, pending, graded };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = getAssignmentStats();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
        <p className="text-gray-600">Track your assignments and submissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Assignments</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <BookOpen className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Submitted</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Graded</p>
              <p className="text-3xl font-bold text-purple-600">{stats.graded}</p>
            </div>
            <FileText className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Assignments</h2>
        </div>
        <div className="p-6">
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No assignments available yet.</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const submission = getSubmissionForAssignment(assignment.id);
                const overdue = isOverdue(assignment.due_date);
                const isSubmitted = submission && (submission.status === 'submitted' || submission.status === 'graded');

                return (
                  <div
                    key={assignment.id}
                    className={`border rounded-lg p-4 hover:border-blue-300 transition-colors ${
                      overdue && !isSubmitted ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                          {overdue && !isSubmitted && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{assignment.courses.title}</p>
                        <p className="text-sm text-gray-700 mb-3">{assignment.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                          <span>Max Score: {assignment.max_score}</span>
                          {submission && submission.status === 'graded' && (
                            <span className="text-green-600 font-medium">
                              Score: {submission.score}/{assignment.max_score}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {submission ? (
                          <>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              submission.status === 'graded' ? 'bg-purple-100 text-purple-700' :
                              submission.status === 'submitted' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {submission.status === 'graded' ? 'Graded' :
                               submission.status === 'submitted' ? 'Submitted' :
                               'Draft'}
                            </span>
                            <button
                              onClick={() => setSelectedAssignment(assignment)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {submission.status === 'graded' ? 'View Results' : 'Edit Submission'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setSelectedAssignment(assignment)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Start Assignment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedAssignment && (
        <SubmissionModal
          assignment={selectedAssignment}
          existingSubmission={getSubmissionForAssignment(selectedAssignment.id)}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={() => {
            loadData();
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
}

function SubmissionModal({
  assignment,
  existingSubmission,
  onClose,
  onSuccess
}: {
  assignment: Assignment;
  existingSubmission?: Submission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { profile } = useAuth();
  const [content, setContent] = useState(existingSubmission?.content || '');
  const [loading, setLoading] = useState(false);
  const [saveType, setSaveType] = useState<'draft' | 'submit'>('draft');

  const isGraded = existingSubmission?.status === 'graded';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);

    const submissionData = {
      assignment_id: assignment.id,
      student_id: profile.id,
      content,
      status: saveType === 'submit' ? 'submitted' : 'draft',
      submitted_at: saveType === 'submit' ? new Date().toISOString() : null,
    };

    if (existingSubmission) {
      await supabase
        .from('submissions')
        .update(submissionData)
        .eq('id', existingSubmission.id);
    } else {
      await supabase
        .from('submissions')
        .insert(submissionData);
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{assignment.title}</h2>
              <p className="text-sm text-gray-600">{assignment.courses.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
            <p className="text-gray-700">{assignment.description}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
              <span>Max Score: {assignment.max_score}</span>
            </div>
          </div>

          {isGraded && existingSubmission && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">
                Grade: {existingSubmission.score}/{assignment.max_score}
              </h3>
              {existingSubmission.feedback && (
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">Teacher Feedback:</p>
                  <p className="text-sm text-green-800">{existingSubmission.feedback}</p>
                </div>
              )}
            </div>
          )}

          {isGraded ? (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Your Submission</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Submission
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={15}
                  placeholder="Type your assignment submission here..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => setSaveType('draft')}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  disabled={loading}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  onClick={() => setSaveType('submit')}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
