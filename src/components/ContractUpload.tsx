import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, Code, Copy } from 'lucide-react';

interface ContractUploadProps {
  onAnalysisComplete: () => void;
}

export const ContractUpload: React.FC<ContractUploadProps> = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [contractCode, setContractCode] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'file' | 'paste'>('file');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.sol')) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
      setContractCode('');
    } else {
      setError('Please select a valid Solidity (.sol) file');
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.sol')) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
      setContractCode('');
    } else {
      setError('Please drop a valid Solidity (.sol) file');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleCodeChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContractCode(event.target.value);
    setFile(null);
    setError(null);
    setResult(null);
  }, []);

  const handleModeSwitch = (mode: 'file' | 'paste') => {
    setUploadMode(mode);
    setFile(null);
    setContractCode('');
    setError(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file && !contractCode.trim()) {
      setError('Please provide a contract file or paste contract code');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let response;

      if (uploadMode === 'file' && file) {
        // File upload mode
        const formData = new FormData();
        formData.append('contract', file);
        
        response = await fetch('/api/analyze-upload', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Paste mode - create a temporary file
        const blob = new Blob([contractCode], { type: 'text/plain' });
        const tempFile = new File([blob], 'pasted-contract.sol', { type: 'text/plain' });
        
        const formData = new FormData();
        formData.append('contract', tempFile);
        
        response = await fetch('/api/analyze-upload', {
          method: 'POST',
          body: formData,
        });
      }

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        onAnalysisComplete();
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePasteSample = () => {
    const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleToken {
    string public name = "SimpleToken";
    string public symbol = "STK";
    uint256 public totalSupply = 1000000 * 10**18;
    uint8 public decimals = 18;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    address public owner;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Invalid address");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        require(to != address(0), "Invalid address");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Invalid address");
        
        totalSupply += amount;
        balanceOf[to] += amount;
        
        emit Transfer(address(0), to, amount);
    }
}`;
    setContractCode(sampleContract);
  };

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBgColor = (score: number) => {
    if (score < 20) return 'bg-green-50 border-green-200';
    if (score < 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Upload className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Upload Smart Contract</h2>
      </div>

      {!result && (
        <>
          {/* Mode Selector */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleModeSwitch('file')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                uploadMode === 'file'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </button>
            <button
              onClick={() => handleModeSwitch('paste')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                uploadMode === 'paste'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="h-4 w-4" />
              <span>Paste Code</span>
            </button>
          </div>

          {/* File Upload Mode */}
          {uploadMode === 'file' && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your Solidity contract here
                  </p>
                  <p className="text-gray-600">or click to browse</p>
                </div>

                <input
                  type="file"
                  accept=".sol"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="contract-upload"
                />
                <label
                  htmlFor="contract-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            </div>
          )}

          {/* Paste Code Mode */}
          {uploadMode === 'paste' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Paste your Solidity contract code
                </label>
                <button
                  onClick={handlePasteSample}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                  <span>Use Sample</span>
                </button>
              </div>
              <textarea
                value={contractCode}
                onChange={handleCodeChange}
                placeholder="pragma solidity ^0.8.0;

contract MyContract {
    // Your contract code here...
}"
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Paste your complete Solidity contract code including pragma statements
              </p>
            </div>
          )}

          {/* Selected File Display */}
          {file && uploadMode === 'file' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{file.name}</p>
                    <p className="text-sm text-blue-600">{Math.round(file.size / 1024)} KB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          {(file || contractCode.trim()) && (
            <div className="mt-4">
              <button
                onClick={handleAnalyze}
                disabled={uploading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing Contract...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Analyze Contract</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-800">Analysis Complete</p>
            </div>
            <p className="text-green-700">Contract: {result.contractName}</p>
          </div>

          <div className={`p-4 border rounded-lg ${getRiskBgColor(result.riskScore)}`}>
            <h3 className="font-semibold text-gray-900 mb-2">Risk Assessment</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Risk Score:</span>
              <span className={`font-bold ${getRiskColor(result.riskScore)}`}>
                {result.riskScore}/100
              </span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">AI Summary</h3>
            <p className="text-gray-700 text-sm">{result.summary.summary || 'Analysis completed'}</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setFile(null);
                setContractCode('');
                setResult(null);
                setError(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Analyze Another
            </button>
            
            <button
              onClick={() => {
                window.location.href = `/deploy/${result.analysisId}`;
              }}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Deploy to Hedera
            </button>
          </div>
        </div>
      )}
    </div>
  );
};