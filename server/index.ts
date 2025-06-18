import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { HederaService } from './services/HederaService.js';
import { AIService } from './services/AIService.js';
import { ContractAnalyzer } from './services/ContractAnalyzer.js';
import { SecurityAuditor } from './services/SecurityAuditor.js';
import { AnalysisStorage, StoredAnalysis } from './services/AnalysisStorage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `contract-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.sol') {
      cb(null, true);
    } else {
      cb(new Error('Only .sol files are allowed'));
    }
  }
});

// Initialize services
let hederaService: HederaService;
let aiService: AIService;
const contractAnalyzer = new ContractAnalyzer();
const securityAuditor = new SecurityAuditor();
const analysisStorage = new AnalysisStorage();

try {
  hederaService = new HederaService();
  console.log('✅ Hedera service initialized');
} catch (error) {
  console.error('❌ Failed to initialize Hedera service:', error.message);
  console.error('Please check your .env file and ensure HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY are set');
  process.exit(1);
}

try {
  aiService = new AIService();
  console.log('✅ AI service initialized');
} catch (error) {
  console.error('❌ Failed to initialize AI service:', error.message);
  console.error('Please check your OPENAI_API_KEY in .env file');
  process.exit(1);
}

// API Routes
app.post('/api/analyze-upload', upload.single('contract'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No contract file uploaded' });
    }

    console.log(`📄 Analyzing contract: ${req.file.originalname}`);
    const contractPath = req.file.path;
    const contractCode = await fs.readFile(contractPath, 'utf8');

    // Parse and analyze contract
    console.log('🔍 Parsing contract...');
    const parsedContract = contractAnalyzer.parseContract(contractCode);
    
    console.log('🤖 Getting AI summary...');
    const aiSummary = await aiService.summarizeContract(contractCode);
    
    console.log('🛡️ Running security audit...');
    const securityReport = securityAuditor.auditContract(contractCode, parsedContract);

    // Store analysis results
    const analysisId = `analysis-${Date.now()}`;
    const analysisData = {
      id: analysisId,
      contractName: parsedContract.contractName,
      summary: aiSummary,
      securityReport,
      contractCode,
      timestamp: new Date().toISOString(),
      originalFilename: req.file.originalname
    };

    console.log('💾 Storing analysis in Hedera File Service...');
    const fileId = await hederaService.storeAnalysis(analysisData);

    // Store in local analysis storage
    const storedAnalysis: StoredAnalysis = {
      id: analysisId,
      contractName: parsedContract.contractName,
      originalFilename: req.file.originalname,
      riskScore: securityReport.riskScore,
      timestamp: new Date().toISOString(),
      status: 'analyzed',
      fileId,
      summary: aiSummary,
      securityReport
    };

    analysisStorage.storeAnalysis(storedAnalysis);

    // Clean up uploaded file
    await fs.remove(contractPath);

    console.log('✅ Analysis complete!');
    res.json({
      success: true,
      analysisId,
      fileId,
      contractName: parsedContract.contractName,
      summary: aiSummary,
      securityReport,
      riskScore: securityReport.riskScore
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze contract',
      details: error.message 
    });
  }
});

app.post('/api/deploy', async (req, res) => {
  try {
    const { analysisId, contractCode, constructorParams = [] } = req.body;

    if (!analysisId) {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    if (!contractCode) {
      return res.status(400).json({ error: 'Contract code is required for deployment' });
    }

    console.log(`🚀 Deploying contract for analysis: ${analysisId}`);

    // Deploy contract to Hedera
    const deploymentResult = await hederaService.deployContract(contractCode, constructorParams);
    
    console.log('✅ Contract deployed successfully:', deploymentResult);

    // Update analysis with deployment info
    const deploymentData = {
      analysisId,
      contractId: deploymentResult.contractId,
      transactionId: deploymentResult.transactionId,
      gasUsed: deploymentResult.gasUsed,
      deploymentTimestamp: new Date().toISOString(),
      network: process.env.HEDERA_NETWORK || 'testnet',
      hashScanLinks: {
        transaction: `${process.env.HASHSCAN_BASE_URL}/transaction/${deploymentResult.transactionId}`,
        contract: `${process.env.HASHSCAN_BASE_URL}/contract/${deploymentResult.contractId}`
      }
    };

    console.log('💾 Storing deployment info in File Service...');
    const deploymentFileId = await hederaService.storeDeployment(deploymentData);

    // Update local storage
    analysisStorage.updateAnalysisStatus(analysisId, 'deployed', {
      contractId: deploymentResult.contractId,
      transactionId: deploymentResult.transactionId
    });

    console.log('🎉 Deployment process complete!');

    res.json({
      success: true,
      contractId: deploymentResult.contractId,
      transactionId: deploymentResult.transactionId,
      gasUsed: deploymentResult.gasUsed,
      deploymentFileId,
      hashScanLinks: deploymentData.hashScanLinks
    });

  } catch (error) {
    console.error('❌ Deployment error:', error);
    res.status(500).json({ 
      error: 'Failed to deploy contract',
      details: error.message 
    });
  }
});

app.get('/api/verify/:contractId', async (req, res) => {
  try {
    const { contractId } = req.params;
    
    console.log(`🔍 Verifying contract: ${contractId}`);
    
    // Verify contract on Hedera Network
    const verificationResult = await hederaService.verifyContract(contractId);
    
    // Update analysis status if verification successful
    if (verificationResult.verified) {
      const analyses = analysisStorage.getAllAnalyses();
      const analysis = analyses.find(a => a.contractId === contractId);
      if (analysis) {
        analysisStorage.updateAnalysisStatus(analysis.id, 'verified');
      }
    }
    
    res.json({
      success: true,
      contractId,
      verified: verificationResult.verified,
      details: verificationResult.details
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify contract',
      details: error.message 
    });
  }
});

// New API endpoints for real data
app.get('/api/recent-analyses', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const recentAnalyses = analysisStorage.getRecentAnalyses(limit);
    
    res.json({
      success: true,
      analyses: recentAnalyses
    });
  } catch (error) {
    console.error('❌ Error fetching recent analyses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent analyses',
      details: error.message 
    });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      totalAnalyses: analysisStorage.getAnalysisCount(),
      contractsDeployed: analysisStorage.getDeployedCount(),
      averageRiskScore: analysisStorage.getAverageRiskScore(),
      highRiskDetected: analysisStorage.getHighRiskCount()
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
});

app.get('/api/analysis/:id', (req, res) => {
  try {
    const { id } = req.params;
    const analysis = analysisStorage.getAnalysis(id);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('❌ Error fetching analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analysis',
      details: error.message 
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const networkStatus = await hederaService.getNetworkStatus();
    
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      services: {
        hedera: networkStatus.status === 'connected',
        openai: !!process.env.OPENAI_API_KEY,
        network: networkStatus.network,
        balance: networkStatus.balance
      },
      networkStatus,
      stats: {
        totalAnalyses: analysisStorage.getAnalysisCount(),
        contractsDeployed: analysisStorage.getDeployedCount()
      }
    });
  } catch (error) {
    res.json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 AI Legal Agent server starting...');
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Hedera Network: ${process.env.HEDERA_NETWORK || 'testnet'}`);
  console.log('✅ Server ready for real Hedera transactions!');
});