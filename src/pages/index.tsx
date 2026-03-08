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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 aurora-light dark:aurora-bg transition-colors">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2.5 gradient-card-purple rounded-xl neon-purple">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gradient">
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
                className="border-violet-200 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10"
              >
                Refresh
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                icon={<LogOut className="h-4 w-4" />}
                className="text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 glass-card border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-start gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="font-medium text-rose-800 dark:text-rose-200">Error</p>
              <p className="text-sm text-rose-600 dark:text-rose-300">{error}</p>
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Conditional Access <span className="text-gradient">Policies</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
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
                <div className="glass-card text-center py-12 rounded-2xl">
                  <div className="inline-flex p-4 gradient-card-purple rounded-2xl neon-purple mb-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No policies found
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
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
