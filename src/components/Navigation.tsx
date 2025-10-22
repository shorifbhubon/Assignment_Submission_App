import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User } from 'lucide-react';

export function Navigation() {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AssignCheck</h1>
              <p className="text-xs text-gray-600">Assignment & Plagiarism Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <User className="w-4 h-4 text-gray-600" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{profile.full_name}</p>
                <p className="text-xs text-gray-600 capitalize">{profile.role}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
