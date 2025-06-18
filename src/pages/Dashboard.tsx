import React, { useState } from 'react';
import { ContractUpload } from '../components/ContractUpload';
import { RecentAnalyses } from '../components/RecentAnalyses';
import { StatsOverview } from '../components/StatsOverview';
import { HederaStatus } from '../components/HederaStatus';

export const Dashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAnalysisComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          AI Legal Agent for Smart Contracts
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Advanced AI-powered legal analysis and security auditing for Solidity smart contracts 
          with real deployment to Hedera Network
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <span>Powered by</span>
          <span className="font-semibold text-blue-600">OpenAI GPT-4</span>
          <span>•</span>
          <span className="font-semibold text-emerald-600">Hedera Hashgraph</span>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StatsOverview key={refreshKey} />
        </div>
        <div>
          <HederaStatus />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contract Upload */}
        <div className="space-y-6">
          <ContractUpload onAnalysisComplete={handleAnalysisComplete} />
        </div>

        {/* Recent Analyses */}
        <div className="space-y-6">
          <RecentAnalyses key={refreshKey} />
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-blue-600 font-bold text-xl">AI</span>
            </div>
            <h3 className="font-semibold text-gray-900">AI Analysis</h3>
            <p className="text-sm text-gray-600">GPT-4 powered legal summarization and risk assessment</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-emerald-600 font-bold text-xl">🔍</span>
            </div>
            <h3 className="font-semibold text-gray-900">Security Audit</h3>
            <p className="text-sm text-gray-600">Comprehensive vulnerability detection and analysis</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-purple-600 font-bold text-xl">⛓️</span>
            </div>
            <h3 className="font-semibold text-gray-900">Hedera Deploy</h3>
            <p className="text-sm text-gray-600">Real deployment to Hedera testnet with proof</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-orange-600 font-bold text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900">HashScan Link</h3>
            <p className="text-sm text-gray-600">On-chain verification and transaction tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
};