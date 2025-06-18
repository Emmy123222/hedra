import React, { useState, useEffect } from 'react';
import { TrendingUp, Shield, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface Stats {
  totalAnalyses: number;
  contractsDeployed: number;
  averageRiskScore: number;
  highRiskDetected: number;
}

export const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalAnalyses: 0,
    contractsDeployed: 0,
    averageRiskScore: 0,
    highRiskDetected: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        console.error('Failed to fetch stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Set up polling to refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  const statCards = [
    {
      label: 'Total Analyses',
      value: stats.totalAnalyses,
      icon: TrendingUp,
      color: 'blue',
      description: 'Smart contracts analyzed'
    },
    {
      label: 'Contracts Deployed',
      value: stats.contractsDeployed,
      icon: CheckCircle,
      color: 'emerald',
      description: 'Successfully deployed to Hedera'
    },
    {
      label: 'Avg Risk Score',
      value: stats.averageRiskScore > 0 ? `${stats.averageRiskScore}/100` : '0/100',
      icon: Shield,
      color: stats.averageRiskScore < 30 ? 'emerald' : stats.averageRiskScore < 60 ? 'yellow' : 'red',
      description: 'Average security risk level'
    },
    {
      label: 'High Risk Detected',
      value: stats.highRiskDetected,
      icon: AlertTriangle,
      color: 'red',
      description: 'Contracts with risk score ≥70'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      emerald: 'bg-emerald-100 text-emerald-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Analytics Overview</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
          title="Refresh Stats"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(stat.color)}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              {stats.totalAnalyses > 0 && (
                <div className="text-xs text-green-600 font-medium">
                  Live
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.totalAnalyses === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-blue-900 font-medium">Ready to Start</p>
              <p className="text-blue-700 text-sm">Upload your first smart contract to see real analytics</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};