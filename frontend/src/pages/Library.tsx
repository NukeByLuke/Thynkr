import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';
import { Search, Filter, Lock, Star, Clock, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Content {
  id: string;
  title: string;
  description: string;
  slug: string;
  requiredRole: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
  thumbnail: string | null;
  tags: string[];
  featured: boolean;
  createdAt: string;
}

// Role hierarchy with legacy support
const roleHierarchy: Record<string, number> = {
  FREE: 1,
  BASIC: 1,
  PRO: 2,
  STANDARD: 2,
  PREMIUM: 3,
  ADMIN: 4,
};

export default function Library() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showFeatured, setShowFeatured] = useState(false);

  // Fetch content from API
  const { data, isLoading } = useQuery({
    queryKey: ['content', searchQuery, showFeatured],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (showFeatured) params.append('featured', 'true');

      const response = await api.get(`/content?${params.toString()}`);
      return response.data;
    },
  });

  const content = data?.content as Content[] | undefined;

  // Check if user has access to content
  const hasAccess = (requiredRole: string) => {
    if (!user) return false;
    return (
      roleHierarchy[user.role as keyof typeof roleHierarchy] >=
      roleHierarchy[requiredRole as keyof typeof roleHierarchy]
    );
  };

  // Filter content based on selected role filter
  const filteredContent = content?.filter((item) => {
    if (filterRole === 'all') return true;
    return item.requiredRole === filterRole;
  });

  return (
    <>
      <Helmet>
        <title>Content Library - Thynkr</title>
        <meta
          name="description"
          content="Browse our extensive library of premium content for all membership tiers."
        />
      </Helmet>

      <PageContainer>
        <PageContainer.Header
          subtitle="Explore our collection of premium content"
          actions={
            <div className="p-2 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          }
        >
          Content Library
        </PageContainer.Header>

        {/* Filters */}
        <PageContainer.Card>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFeatured(!showFeatured)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFeatured
                  ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Star className="w-4 h-4" />
              Featured
            </button>

            <div className="flex items-center gap-2 border-l pl-3 ml-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by tier:</span>
              {['all', 'BASIC', 'STANDARD', 'PREMIUM'].map((role) => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filterRole === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role === 'all' ? 'All' : role}
                </button>
              ))}
            </div>
          </div>
        </PageContainer.Card>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredContent && filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => {
              const hasUserAccess = hasAccess(item.requiredRole);

              return (
                <Card key={item.id} className="group hover:shadow-xl transition-shadow">
                  <Link to={hasUserAccess ? `/library/${item.slug}` : '/pricing'} className="block">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg overflow-hidden">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <TrendingUp className="w-12 h-12 text-white opacity-50" />
                        </div>
                      )}

                      {/* Featured Badge */}
                      {item.featured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </div>
                      )}

                      {/* Access Lock Overlay */}
                      {!hasUserAccess && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Lock className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm font-semibold">{item.requiredRole} Required</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content Info */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            item.requiredRole === 'BASIC'
                              ? 'bg-gray-100 text-gray-700'
                              : item.requiredRole === 'STANDARD'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {item.requiredRole}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No content found</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setFilterRole('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Upgrade CTA for Basic Users */}
        {user?.role === 'BASIC' && (
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Unlock Premium Content</h2>
            <p className="text-blue-100 mb-4">
              Upgrade to Standard or Premium to access exclusive content
            </p>
            <Link to="/pricing">
              <Button variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
                View Plans
              </Button>
            </Link>
          </div>
        )}
      </PageContainer>
    </>
  );
}
