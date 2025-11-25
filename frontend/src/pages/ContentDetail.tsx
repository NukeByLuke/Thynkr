import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Clock, Lock, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

interface Content {
  id: string;
  title: string;
  description: string;
  content: string;
  slug: string;
  requiredRole: 'FREE' | 'PRO' | 'PREMIUM' | 'ADMIN';
  thumbnail: string | null;
  tags: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

const roleHierarchy = { FREE: 1, PRO: 2, PREMIUM: 3, ADMIN: 4 };

export default function ContentDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch content by slug
  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['content', slug],
    queryFn: async () => {
      const response = await api.get(`/content/${slug}`);
      return response.data as Content;
    },
    enabled: !!slug,
  });

  // Check if user has access
  const hasAccess = (requiredRole: string) => {
    if (!user) return false;
    return (
      roleHierarchy[user.role as keyof typeof roleHierarchy] >=
      roleHierarchy[requiredRole as keyof typeof roleHierarchy]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Not Found</h2>
          <p className="text-gray-600 mb-6">
            The content you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/library">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const userHasAccess = hasAccess(content.requiredRole);

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'FREE':
        return 'bg-gray-100 text-gray-700';
      case 'PRO':
        return 'bg-blue-100 text-blue-700';
      case 'PREMIUM':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Helmet>
        <title>{content.title} - Thynkr</title>
        <meta name="description" content={content.description} />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header Card */}
        <Card className="mb-8">
          {/* Thumbnail */}
          {content.thumbnail ? (
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg overflow-hidden mb-6">
              <img
                src={content.thumbnail}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg overflow-hidden mb-6 flex items-center justify-center">
              <TrendingUp className="w-16 h-16 text-white opacity-50" />
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-md text-sm font-semibold ${getRoleBadgeClass(content.requiredRole)}`}
            >
              {content.requiredRole}
            </span>

            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {new Date(content.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>

            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {Math.ceil(content.content.split(' ').length / 200)} min read
            </span>
          </div>

          {/* Title & Description */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{content.description}</p>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Content */}
        {userHasAccess ? (
          <Card>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{
                __html: content.content.replace(/\n/g, '<br />'),
              }}
            />
          </Card>
        ) : (
          <Card className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {content.requiredRole} Membership Required
            </h2>
            <p className="text-gray-600 mb-6">
              Upgrade your account to access this premium content
            </p>
            <Link to="/pricing">
              <Button size="lg">View Membership Plans</Button>
            </Link>
          </Card>
        )}

        {/* Related Content Placeholder */}
        {userHasAccess && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Like This</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Placeholder for related content */}
              <Card className="p-6 text-center text-gray-500">
                <p>Related content coming soon</p>
              </Card>
              <Card className="p-6 text-center text-gray-500">
                <p>Related content coming soon</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
