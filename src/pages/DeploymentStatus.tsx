import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Rocket, CheckCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

export const DeploymentStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [deployment, setDeployment] = useState<any>(null);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load analysis data
    setDeployment({
      analysisId: id,
      contractName: 'ERC20Token',
      riskScore: 25,
      status: 'ready'
    });
  }, [id]);

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);

    try {
      console.log('Starting deployment for analysis:', id);
      
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisId: id,
          contractCode: `
            pragma solidity ^0.8.0;
            
            contract ${deployment.contractName} {
                string public name = "${deployment.contractName}";
                string public symbol = "TOKEN";
                uint256 public totalSupply = 1000000;
                
                mapping(address => uint256) public balanceOf;
                
                constructor() {
                    balanceOf[msg.sender] = totalSupply;
                }
                
                function transfer(address to, uint256 amount) public returns (bool) {
                    require(balanceOf[msg.sender] >= amount, "Insufficient balance");
                    balanceOf[msg.sender] -= amount;
                    balanceOf[to] += amount;
                    return true;
                }
            }
          `,
          constructorParams: []
        }),
      });

      const data = await response.json();
      console.log('Deployment response:', data);

      if (response.ok && data.success) {
        setDeployment(prev => ({
          ...prev,
          status: 'deployed',
          contractId: data.contractId,
          transactionId: data.transactionId,
          deploymentFileId: data.deploymentFileId,
          hashScanLinks: data.hashScanLinks
        }));
      } else {
        setError(data.error || data.details || 'Deployment failed');
      }
    } catch (err) {
      console.error('Deployment error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setDeploying(false);
    }
  };

  if (!deployment) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to={`/analysis/${id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deploy {deployment.contractName}</h1>
          <p className="text-gray-600">Deploy to Hedera Testnet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deployment Panel */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Rocket className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Deployment</h2>
          </div>

          {deployment.status === 'ready' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Ready to Deploy</h3>
                <p className="text-blue-700">
                  Your contract has been analyzed and is ready for deployment to Hedera Testnet.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contract</span>
                  <span className="font-medium text-gray-900">{deployment.contractName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Risk Score</span>
                  <span className={`font-medium ${deployment.riskScore < 20 ? 'text-green-600' : deployment.riskScore < 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {deployment.riskScore}/100
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Network</span>
                  <span className="font-medium text-gray-900">Hedera Testnet</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Gas</span>
                  <span className="font-medium text-gray-900">~0.001 HBAR</span>
                </div>
              </div>

              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {deploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    <span>Deploy Contract</span>
                  </>
                )}
              </button>
            </div>
          )}

          {deployment.status === 'deployed' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Deployment Successful</h3>
                </div>
                <p className="text-green-700">
                  Your contract has been successfully deployed to Hedera Testnet.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contract ID</span>
                  <span className="font-mono text-gray-900">{deployment.contractId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-mono text-gray-900 truncate max-w-32" title={deployment.transactionId}>
                    {deployment.transactionId}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">File ID</span>
                  <span className="font-mono text-gray-900">{deployment.deploymentFileId}</span>
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href={deployment.hashScanLinks?.transaction}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View Transaction</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
                
                <a
                  href={deployment.hashScanLinks?.contract}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>View Contract</span>
                  <ExternalLink className="h-4 w-4" />
                </a>

                <Link
                  to={`/verify/${deployment.contractId}`}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span>Verify Contract</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Deployment Failed</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-600 hover:text-red-700 text-sm underline mt-2"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deployment Steps */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Deployment Process</h2>
          
          <div className="space-y-4">
            <div className={`flex items-center space-x-3 ${deployment.status !== 'ready' ? 'opacity-50' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deployment.status === 'ready' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                {deployment.status === 'ready' ? '1' : <CheckCircle className="h-4 w-4" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contract Analysis</h3>
                <p className="text-sm text-gray-600">AI analysis and security audit completed</p>
              </div>
            </div>

            <div className={`flex items-center space-x-3 ${deployment.status === 'ready' ? 'opacity-50' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deployment.status === 'deployed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                {deployment.status === 'deployed' ? <CheckCircle className="h-4 w-4" /> : deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : '2'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Contract Deployment</h3>
                <p className="text-sm text-gray-600">Deploy to Hedera Smart Contract Service</p>
              </div>
            </div>

            <div className={`flex items-center space-x-3 ${deployment.status !== 'deployed' ? 'opacity-50' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deployment.status === 'deployed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {deployment.status === 'deployed' ? <CheckCircle className="h-4 w-4" /> : '3'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">File Service Storage</h3>
                <p className="text-sm text-gray-600">Store deployment metadata on-chain</p>
              </div>
            </div>

            <div className={`flex items-center space-x-3 ${deployment.status !== 'deployed' ? 'opacity-50' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deployment.status === 'deployed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {deployment.status === 'deployed' ? <CheckCircle className="h-4 w-4" /> : '4'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">HashScan Verification</h3>
                <p className="text-sm text-gray-600">Generate proof links for transparency</p>
              </div>
            </div>
          </div>

          {deployment.status === 'deployed' && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h3 className="font-semibold text-emerald-900 mb-2">🎉 Deployment Complete!</h3>
              <p className="text-emerald-700 text-sm">
                Your smart contract is now live on Hedera Testnet. You can interact with it using the contract ID above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};