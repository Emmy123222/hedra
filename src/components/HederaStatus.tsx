import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, Zap } from 'lucide-react';

interface HederaStatus {
  network: string;
  status: 'online' | 'offline' | 'degraded';
  lastBlock: number;
  gasPrice: string;
  responseTime: number;
}

export const HederaStatus: React.FC = () => {
  const [status, setStatus] = useState<HederaStatus>({
    network: 'Testnet',
    status: 'online',
    lastBlock: 0,
    gasPrice: '0.000001 HBAR',
    responseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Simulate API call to check Hedera status
        setTimeout(() => {
          setStatus({
            network: 'Testnet',
            status: 'online',
            lastBlock: Math.floor(Math.random() * 1000000) + 5000000,
            gasPrice: '0.000001 HBAR',
            responseTime: Math.floor(Math.random() * 50) + 100
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        setStatus(prev => ({ ...prev, status: 'offline' }));
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-50 border-green-200';
      case 'degraded': return 'bg-yellow-50 border-yellow-200';
      case 'offline': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="h-5 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-purple-100 p-2 rounded-lg">
          <Activity className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Hedera Status</h2>
      </div>

      <div className="space-y-4">
        <div className={`p-3 rounded-lg border ${getStatusBgColor(status.status)}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status.status === 'online' ? 'bg-green-500 animate-pulse' : status.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span className="font-semibold text-gray-900">{status.network}</span>
            <span className={`text-sm font-medium ${getStatusColor(status.status)}`}>
              {status.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Latest Block</span>
            <span className="font-mono text-sm text-gray-900">
              #{status.lastBlock.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Gas Price</span>
            <span className="font-mono text-sm text-gray-900">{status.gasPrice}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Response Time</span>
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="font-mono text-sm text-gray-900">{status.responseTime}ms</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <a
            href="https://hashscan.io/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span>View on HashScan</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};