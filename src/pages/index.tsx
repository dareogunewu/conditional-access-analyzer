import { useState } from 'react';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { useConditionalAccess } from '../hooks/useConditionalAccess';
import LandingPage from '../components/LandingPage';
import PolicyCard from '../components/PolicyCard';
import PolicyAnalytics from '../components/PolicyAnalytics';
import PolicyReports from '../components/PolicyReports';
import PolicyDetailModal from '../components/PolicyDetailModal';
import { ConditionalAccessPolicy } from '../types/conditionalAccess';
import { Button, SearchInput } from '../components/ui';
import ThemeToggle from '../components/ui/ThemeToggle';
import { SkeletonCard } from '../components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import {
  Shield,
  RefreshCw,
  LogOut,
  LayoutGrid,
  BarChart3,
  FileText,
  AlertCircle,
} from 'lucide-react';

export default function Home() {
  const isAuthenticated = useIsAuthenticated();
  const { instance } = useMsal();
  const { policies, loading, error, fetchPolicies } = useConditionalAccess();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<ConditionalAccessPolicy | null>(null);

  const filteredPolicies = policies.filter(policy =>
    policy.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    instance.logoutPopup();
  };

  const handleViewPolicy = (policy: ConditionalAccessPolicy) => {
    setSelectedPolicy(policy);
  };

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                CA Analyzer
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                onClick={fetchPolicies}
                variant="outline"
                size="sm"
                loading={loading}
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                icon={<LogOut className="h-4 w-4" />}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Error</p>
              <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="policies">
          <TabsList className="mb-6">
            <TabsTrigger value="policies" icon={<LayoutGrid className="h-4 w-4" />}>
              Policies
            </TabsTrigger>
            <TabsTrigger value="analytics" icon={<BarChart3 className="h-4 w-4" />}>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" icon={<FileText className="h-4 w-4" />}>
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="policies">
            <div className="space-y-6">
              {/* Search & Count */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Conditional Access Policies
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {filteredPolicies.length} {filteredPolicies.length === 1 ? 'policy' : 'policies'} found
                  </p>
                </div>
                <div className="w-full sm:w-72">
                  <SearchInput
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {/* Policy Grid */}
              {!loading && filteredPolicies.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPolicies.map((policy) => (
                    <PolicyCard
                      key={policy.id}
                      policy={policy}
                      onView={handleViewPolicy}
                    />
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredPolicies.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No policies found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {searchTerm
                      ? `No policies match "${searchTerm}". Try adjusting your search.`
                      : 'No Conditional Access policies were found in your tenant.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <PolicyAnalytics policies={policies} />
          </TabsContent>

          <TabsContent value="reports">
            <PolicyReports policies={policies} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Policy Detail Modal */}
      <PolicyDetailModal
        policy={selectedPolicy}
        isOpen={!!selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
      />
    </div>
  );
}
