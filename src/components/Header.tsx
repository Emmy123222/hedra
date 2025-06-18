import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Gavel, ExternalLink } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-blue-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Legal Agent</h1>
              <p className="text-xs text-gray-500">Smart Contract Auditing on Hedera</p>
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Dashboard
            </Link>
            
            <a
              href="https://hashscan.io/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <span>HashScan</span>
              <ExternalLink className="h-4 w-4" />
            </a>

            <div className="flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-700">Testnet</span>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};