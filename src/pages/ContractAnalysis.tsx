import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';

export const ContractAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;

      try {
        const response = await fetch(`/api/analysis/${id}`);
        const data = await response.json();

        if (data.success) {
          setAnalysis(data.analysis);
        } else {
          setError(data.error || 'Analysis not found');
        }
      } catch (err) {
        setError('Failed to load analysis');
        console.error('Error fetching analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 20) return { level: 'LOW', color: 'text-green-600' };
    if (score < 50) return { level: 'MEDIUM', color: 'text-yellow-600' };
    return { level: 'HIGH', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Not Found</h2>
        <p className="text-gray-600 mb-4">{error || 'The requested contract analysis could not be found.'}</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const riskLevel = getRiskLevel(analysis.riskScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{analysis.contractName}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Analysis ID: {analysis.id}</span>
            <span>•</span>
            <span>File: {analysis.originalFilename}</span>
            <span>•</span>
            <span>{new Date(analysis.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Analysis Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">AI Legal Summary</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
                <p className="text-gray-700">{analysis.summary?.summary || 'Summary not available'}</p>
              </div>

              {analysis.summary?.keyFunctions && analysis.summary.keyFunctions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Key Functions</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.summary.keyFunctions.map((func: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {func}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.summary?.accessControls && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Access Controls</h3>
                  <p className="text-gray-700">{analysis.summary.accessControls}</p>
                </div>
              )}

              {analysis.summary?.legalImplications && analysis.summary.legalImplications.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Legal Implications</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {analysis.summary.legalImplications.map((implication: string, index: number) => (
                      <li key={index}>{implication}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.summary?.complianceNotes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Compliance Notes</h3>
                  <p className="text-gray-700">{analysis.summary.complianceNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Security Issues */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Security Issues</h2>
            </div>

            {analysis.securityReport?.issues && analysis.securityReport.issues.length > 0 ? (
              <div className="space-y-4">
                {analysis.securityReport.issues.map((issue: any, index: number) => (
                  <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(issue.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{issue.type}</h3>
                      <span className="px-2 py-1 rounded text-xs font-medium">
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{issue.description}</p>
                    <p className="text-sm font-medium">Recommendation: {issue.recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-700 font-semibold">No security issues detected</p>
                <p className="text-green-600 text-sm">Contract follows security best practices</p>
              </div>
            )}
          </div>

          {/* Passed Checks */}
          {analysis.securityReport?.passedChecks && analysis.securityReport.passedChecks.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Passed Security Checks</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.securityReport.passedChecks.map((check: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-green-700 text-sm">{check}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Risk Assessment & Actions */}
        <div className="space-y-6">
          {/* Risk Score */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Risk Assessment</h2>
            </div>

            <div className="text-center space-y-4">
              <div>
                <div className={`text-4xl font-bold ${riskLevel.color} mb-2`}>
                  {analysis.riskScore}/100
                </div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${riskLevel.color} bg-opacity-10`}>
                  {riskLevel.level} RISK
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${analysis.riskScore < 20 ? 'bg-green-500' : analysis.riskScore < 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(analysis.riskScore, 100)}%` }}
                ></div>
              </div>

              <p className="text-sm text-gray-600">
                {analysis.securityReport?.summary || 'Security analysis completed'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-3">
              <Link
                to={`/deploy/${analysis.id}`}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <span>Deploy to Hedera</span>
                <ExternalLink className="h-4 w-4" />
              </Link>

              {analysis.contractId && (
                <a
                  href={`https://hashscan.io/testnet/contract/${analysis.contractId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View on HashScan</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}

              <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Download Report
              </button>
            </div>
          </div>

          {/* File Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">File Information</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  analysis.status === 'analyzed' ? 'bg-blue-100 text-blue-700' :
                  analysis.status === 'deployed' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {analysis.status}
                </span>
              </div>
              
              {analysis.fileId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">File ID</span>
                  <span className="font-mono text-gray-900">{analysis.fileId}</span>
                </div>
              )}
              
              {analysis.contractId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Contract ID</span>
                  <span className="font-mono text-gray-900">{analysis.contractId}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Analyzed</span>
                <span className="text-gray-900">
                  {new Date(analysis.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};