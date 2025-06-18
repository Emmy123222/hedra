import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

export const ContractVerification: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (contractId) {
      verifyContract();
    }
  }, [contractId]);

  const verifyContract = async () => {
    setLoading(true);
    setVerifying(true);

    try {
      const response = await fetch(`/api/verify/${contractId}`);
      const data = await response.json();

      if (response.ok) {
        setVerification(data);
      } else {
        setVerification({
          success: false,
          error: data.error || 'Verification failed'
        });
      }
    } catch (error) {
      setVerification({
        success: false,
        error: 'Failed to verify contract'
      });
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  if (loading) {
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
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract Verification</h1>
          <p className="text-gray-600">Verify contract on Hedera Network</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-center space-y-4">
            {verification?.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-900">Contract Verified</h2>
                <p className="text-green-700">
                  Contract {contractId} has been successfully verified on Hedera Network.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-900">Verification Failed</h2>
                <p className="text-red-700">
                  {verification?.error || 'Unable to verify contract on Hedera Network.'}
                </p>
              </>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Contract ID</h3>
              <p className="font-mono text-sm text-gray-700">{contractId}</p>
            </div>

            {verification?.success && (
              <div className="space-y-3">
                <a
                  href={`https://hashscan.io/testnet/contract/${contractId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View on HashScan</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            <div className="pt-4">
              <button
                onClick={verifyContract}
                disabled={verifying}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 mx-auto"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Again</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};