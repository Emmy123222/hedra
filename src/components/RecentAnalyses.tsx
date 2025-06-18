import React, { useState, useEffect } from 'react';
import { FileText, Shield, ExternalLink, Calendar, RefreshCw } from 'lucide-react';

interface Analysis {
  id: string;
  contractName: string;
  originalFilename: string;
  riskScore: number;
  timestamp: string;
  status: 'analyzed' | 'deployed' | 'verified';
  fileId?: string;
  contractId?: string;
  transactionId?: string;
}

export const RecentAnalyses: React.FC = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentAnalyses = async () => {
    try {
      const response = await fetch('/api/recent-analyses?limit=10');
      const data = await response.json();
      
      if (data.success) {
        setAnalyses(data.analyses);
      } else {
        console.error('Failed to fetch recent analyses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecentAnalyses();
    
    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(fetchRecentAnalyses, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecentAnalyses();
  };

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadgeColor = (score: number) => {
    if (score < 20) return 'bg-green-100 text-green-700';
    if (score < 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed': return 'bg-blue-100 text-blue-700';
      case 'deployed': return 'bg-emerald-100 text-emerald-700';
      case 'verified': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Analyses</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Analyses</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
      </div>

      {analyses.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500">No contracts analyzed yet</p>
          <p className="text-sm text-gray-400">Upload your first contract to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
              onClick={() => {
                window.location.href = `/analysis/${analysis.id}`;
              }}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {analysis.contractName}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
                    {analysis.status}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTimeAgo(analysis.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <span>Risk:</span>
                    <span className={`font-medium ${getRiskColor(analysis.riskScore)}`}>
                      {analysis.riskScore}/100
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 truncate max-w-24" title={analysis.originalFilename}>
                    {analysis.originalFilename}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center space-x-2">
                {analysis.contractId && (
                  <a
                    href={`https://hashscan.io/testnet/contract/${analysis.contractId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    title="View on HashScan"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {analyses.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Showing {analyses.length} recent analyses</span>
            <span>Auto-refreshes every 30s</span>
          </div>
        </div>
      )}
    </div>
  );
};