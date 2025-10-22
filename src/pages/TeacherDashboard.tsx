import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BookOpen, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { PlagiarismReport } from '../components/PlagiarismReport';

type Course = Database['public']['Tables']['courses']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'] & {
  courses: Pick<Course, 'title'>;
  submission_count?: number;
};

export function TeacherDashboard() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile) return;

    const [coursesResult, assignmentsResult] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('assignments')
        .select(`
          *,
          courses (title)
        `)
        .eq('teacher_id', profile.id)
        .order('created_at', { ascending: false })
    ]);

    if (coursesResult.data) setCourses(coursesResult.data);
    if (assignmentsResult.data) {
      const assignmentsWithCounts = await Promise.all(
        assignmentsResult.data.map(async (assignment) => {
          const { count } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', assignment.id);
          return { ...assignment, submission_count: count || 0 };
        })
      );
      setAssignments(assignmentsWithCounts);
    }

    setLoading(false);
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    await supabase.from('assignments').delete().eq('id', id);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
        <p className="text-gray-600">Manage your courses and assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Courses</p>
              <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
            </div>
            <BookOpen className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Assignments</p>
              <p className="text-3xl font-bold text-green-600">{assignments.length}</p>
            </div>
            <BookOpen className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Submissions</p>
              <p className="text-3xl font-bold text-orange-600">
                {assignments.reduce((sum, a) => sum + (a.submission_count || 0), 0)}
              </p>
            </div>
            <BookOpen className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
            <button
              onClick={() => setShowCourseModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Course
            </button>
          </div>
        </div>
        <div className="p-6">
          {courses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No courses yet. Create your first course to get started.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">My Assignments</h2>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              disabled={courses.length === 0}
            >
              <Plus className="w-4 h-4" />
              New Assignment
            </button>
          </div>
        </div>
        <div className="p-6">
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No assignments yet. Create your first assignment.</p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{assignment.courses.title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                        <span>{assignment.submission_count} submissions</span>
                        <span>Max Score: {assignment.max_score}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAssignment(assignment.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Submissions"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteAssignment(assignment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCourseModal && (
        <CourseModal onClose={() => setShowCourseModal(false)} onSuccess={loadData} />
      )}

      {showAssignmentModal && (
        <AssignmentModal courses={courses} onClose={() => setShowAssignmentModal(false)} onSuccess={loadData} />
      )}

      {selectedAssignment && (
        <SubmissionsModal assignmentId={selectedAssignment} onClose={() => setSelectedAssignment(null)} />
      )}
    </div>
  );
}

function CourseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    await supabase.from('courses').insert({
      title,
      description,
      teacher_id: profile.id,
    });

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Course</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignmentModal({ courses, onClose, onSuccess }: { courses: Course[]; onClose: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    await supabase.from('assignments').insert({
      title,
      description,
      course_id: courseId,
      teacher_id: profile.id,
      due_date: dueDate,
      max_score: maxScore,
    });

    setLoading(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Assignment</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Score</label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="1"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubmissionsModal({ assignmentId, onClose }: { assignmentId: string; onClose: () => void }) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  useEffect(() => {
    loadSubmissions();
  }, [assignmentId]);

  const loadSubmissions = async () => {
    const [assignmentResult, submissionsResult] = await Promise.all([
      supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single(),
      supabase
        .from('submissions')
        .select(`
          *,
          profiles (full_name, email)
        `)
        .eq('assignment_id', assignmentId)
    ]);

    if (assignmentResult.data) setAssignment(assignmentResult.data);
    if (submissionsResult.data) setSubmissions(submissionsResult.data);
    setLoading(false);
  };

  const updateSubmission = async (submissionId: string, score: number, feedback: string) => {
    await supabase
      .from('submissions')
      .update({ score, feedback, status: 'graded' })
      .eq('id', submissionId);

    loadSubmissions();
    setSelectedSubmission(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Submissions: {assignment?.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{submission.profiles.full_name}</h3>
                      <p className="text-sm text-gray-600">{submission.profiles.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      submission.status === 'graded' ? 'bg-green-100 text-green-700' :
                      submission.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {submission.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{submission.content.substring(0, 150)}...</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Not submitted'}
                    </span>
                    {submission.status === 'graded' && (
                      <span className="text-sm font-medium text-green-600">Score: {submission.score}/{assignment.max_score}</span>
                    )}
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {submission.status === 'graded' ? 'View/Edit Grade' : 'Grade'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSubmission && (
          <GradeModal
            submission={selectedSubmission}
            maxScore={assignment.max_score}
            onClose={() => setSelectedSubmission(null)}
            onSave={updateSubmission}
          />
        )}
      </div>
    </div>
  );
}

function GradeModal({ submission, maxScore, onClose, onSave }: any) {
  const [score, setScore] = useState(submission.score || 0);
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [showPlagiarism, setShowPlagiarism] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(submission.id, score, feedback);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Grade Submission</h3>
          <p className="text-sm text-gray-600">Student: {submission.profiles.full_name}</p>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowPlagiarism(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !showPlagiarism ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Submission
            </button>
            <button
              onClick={() => setShowPlagiarism(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showPlagiarism ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Plagiarism Check
            </button>
          </div>

          {!showPlagiarism ? (
            <>
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Submission Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Score (out of {maxScore})
                  </label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    max={maxScore}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Grade
                  </button>
                </div>
              </form>
            </>
          ) : (
            <PlagiarismReport
              submissionId={submission.id}
              assignmentId={submission.assignment_id}
              submissionContent={submission.content}
            />
          )}
        </div>
      </div>
    </div>
  );
}
