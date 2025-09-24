import { useState } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { useConditionalAccess } from '../hooks/useConditionalAccess';
import LandingPage from '../components/LandingPage';
import PolicyCard from '../components/PolicyCard';
import PolicyAnalytics from '../components/PolicyAnalytics';
import PolicyReports from '../components/PolicyReports';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const { policies, loading, error, fetchPolicies } = useConditionalAccess();
  const [currentView, setCurrentView] = useState<'policies' | 'analytics' | 'reports'>('policies');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPolicies = policies.filter(policy =>
    policy.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    instance.logoutPopup();
  };

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Conditional Access Analyzer
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchPolicies}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-8">
          <div className="flex space-x-4 border-b">
            {[
              { key: 'policies', label: 'Policies' },
              { key: 'analytics', label: 'Analytics' },
              { key: 'reports', label: 'Reports' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as any)}
                className={`px-4 py-2 ${
                  currentView === key
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {currentView === 'policies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Conditional Access Policies ({filteredPolicies.length})
              </h2>
              <input
                type="text"
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading policies...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPolicies.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              </div>
            )}

            {!loading && filteredPolicies.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No policies found.</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'analytics' && <PolicyAnalytics policies={policies} />}
        {currentView === 'reports' && <PolicyReports policies={policies} />}
      </main>
    </div>
  );
}