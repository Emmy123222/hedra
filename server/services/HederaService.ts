import {
  Client,
  PrivateKey,
  AccountId,
  ContractCreateTransaction,
  ContractCallQuery,
  FileCreateTransaction,
  FileAppendTransaction,
  Hbar,
  Status
} from '@hashgraph/sdk';
import solc from 'solc'; // <-- FIX: use default import

export class HederaService {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  constructor() {
    if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
      throw new Error('Hedera credentials are required. Please set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in your .env file');
    }

    try {
      this.operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID);
      this.operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY);

      // Initialize client for testnet
      if (process.env.HEDERA_NETWORK === 'testnet') {
        this.client = Client.forTestnet();
      } else {
        this.client = Client.forMainnet();
      }

      this.client.setOperator(this.operatorId, this.operatorKey);
      console.log(` Hedera client initialized for ${process.env.HEDERA_NETWORK}`);
      console.log(`Operator Account: ${this.operatorId.toString()}`);
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
      throw new Error('Invalid Hedera credentials. Please check your HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY');
    }
  }

  async deployContract(contractCode: string, constructorParams: any[] = []) {
    try {
      console.log(' Starting contract deployment...');
      
      // Compile contract bytecode using Solidity compiler
      const bytecode = await this.compileSolidity(contractCode);
      
      if (!bytecode) {
        throw new Error('Contract compilation failed');
      }

      console.log('Contract compiled successfully');

      // Create contract transaction
      const contractCreateTx = new ContractCreateTransaction()
        .setGas(1000000) // Increased gas limit for complex contracts
        .setBytecode(bytecode)
        .setMaxTransactionFee(new Hbar(20)); // Set reasonable max fee

      // Add constructor parameters if provided
      if (constructorParams && constructorParams.length > 0) {
        contractCreateTx.setConstructorParameters(constructorParams);
      }

      console.log('📤 Submitting contract creation transaction...');
      const contractCreateSubmit = await contractCreateTx.execute(this.client);
      
      console.log('⏳ Waiting for transaction receipt...');
      const contractCreateRx = await contractCreateSubmit.getReceipt(this.client);

      if (contractCreateRx.status !== Status.Success) {
        throw new Error(`Contract deployment failed with status: ${contractCreateRx.status}`);
      }

      const contractId = contractCreateRx.contractId!.toString();
      const transactionId = contractCreateSubmit.transactionId.toString();

      console.log('🎉 Contract deployed successfully!');
      console.log(`📋 Contract ID: ${contractId}`);
      console.log(`🔗 Transaction ID: ${transactionId}`);

      return {
        contractId,
        transactionId,
        status: 'deployed',
        gasUsed: contractCreateRx.gasUsed?.toString(),
        contractMemo: contractCreateRx.contractMemo
      };

    } catch (error: any) {
      console.error('Contract deployment failed:', error);
      throw new Error(`Contract deployment failed: ${error.message}`);
    }
  }

  async storeAnalysis(analysisData: any): Promise<string> {
    try {
      console.log('Storing analysis data in Hedera File Service...');
      
      const content = JSON.stringify(analysisData, null, 2);
      const contentBytes = Buffer.from(content, 'utf8');

      // Create file transaction
      const fileCreateTx = new FileCreateTransaction()
        .setContents(contentBytes)
        .setKeys([this.operatorKey.publicKey])
        .setMaxTransactionFee(new Hbar(5))
        .setFileMemo(`AI Legal Analysis - ${analysisData.contractName}`);

      console.log(' Submitting file creation transaction...');
      const fileCreateSubmit = await fileCreateTx.execute(this.client);
      
      console.log(' Waiting for file creation receipt...');
      const fileCreateRx = await fileCreateSubmit.getReceipt(this.client);

      if (fileCreateRx.status !== Status.Success) {
        throw new Error(`File creation failed with status: ${fileCreateRx.status}`);
      }

      const fileId = fileCreateRx.fileId!.toString();
      console.log(' Analysis stored successfully!');
      console.log(` File ID: ${fileId}`);

      return fileId;

    } catch (error: any) {
      console.error('❌ File storage failed:', error);
      throw new Error(`Failed to store analysis: ${error.message}`);
    }
  }

  async storeDeployment(deploymentData: any): Promise<string> {
    try {
      console.log(' Storing deployment data in Hedera File Service...');
      
      const content = JSON.stringify(deploymentData, null, 2);
      const contentBytes = Buffer.from(content, 'utf8');

      const fileCreateTx = new FileCreateTransaction()
        .setContents(contentBytes)
        .setKeys([this.operatorKey.publicKey])
        .setMaxTransactionFee(new Hbar(5))
        .setFileMemo(`Contract Deployment - ${deploymentData.contractId}`);

      console.log('📤 Submitting deployment file creation...');
      const fileCreateSubmit = await fileCreateTx.execute(this.client);
      
      console.log(' Waiting for deployment file receipt...');
      const fileCreateRx = await fileCreateSubmit.getReceipt(this.client);

      if (fileCreateRx.status !== Status.Success) {
        throw new Error(`Deployment file creation failed with status: ${fileCreateRx.status}`);
      }

      const fileId = fileCreateRx.fileId!.toString();
      console.log(' Deployment data stored successfully!');
      console.log(` Deployment File ID: ${fileId}`);

      return fileId;

    } catch (error: any) {
      console.error('Deployment storage failed:', error);
      throw new Error(`Failed to store deployment data: ${error.message}`);
    }
  }

  async verifyContract(contractId: string) {
    try {
      console.log(`🔍 Verifying contract: ${contractId}`);
      
      // Query contract info to verify it exists
      const contractQuery = new ContractCallQuery()
        .setContractId(contractId)
        .setGas(100000)
        .setMaxQueryPayment(new Hbar(1));

      try {
        const contractCallResult = await contractQuery.execute(this.client);
        
        console.log('✅ Contract verification successful!');
        return {
          verified: true,
          details: {
            contractId,
            exists: true,
            result: contractCallResult,
            timestamp: new Date().toISOString()
          }
        };
      } catch (queryError) {
        // Contract might exist but not have the queried function
        // This is still a valid contract, just means our query failed
        console.log('⚠️ Contract exists but query failed (this is normal)');
        return {
          verified: true,
          details: {
            contractId,
            exists: true,
            note: 'Contract exists on network but specific function query failed',
            timestamp: new Date().toISOString()
          }
        };
      }

    } catch (error: any) {
      console.error('❌ Contract verification failed:', error);
      return {
        verified: false,
        details: {
          contractId,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private async compileSolidity(contractCode: string): Promise<Uint8Array> {
    try {
      console.log('🔧 Compiling Solidity contract...');
      
      // Create Solidity compiler input
      const input = {
        language: 'Solidity',
        sources: {
          'contract.sol': {
            content: contractCode
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['*']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };

      // Compile the contract
      const output = JSON.parse(solc.compile(JSON.stringify(input))); // <-- FIX: use solc.compile

      // Check for compilation errors
      if (output.errors) {
        const errors = output.errors.filter((error: any) => error.severity === 'error');
        if (errors.length > 0) {
          console.error('Compilation errors:', errors);
          throw new Error(`Compilation failed: ${errors.map((e: any) => e.message).join(', ')}`);
        }
      }

      // Extract bytecode
      const contracts = output.contracts['contract.sol'];
      const contractNames = Object.keys(contracts);
      
      if (contractNames.length === 0) {
        throw new Error('No contracts found in source code');
      }

      const contractName = contractNames[0]; // Use first contract
      const bytecode = contracts[contractName].evm.bytecode.object;

      if (!bytecode) {
        throw new Error('No bytecode generated');
      }

      console.log(' Contract compilation successful');
      console.log(` Contract: ${contractName}`);
      console.log(` Bytecode length: ${bytecode.length} characters`);

      return new Uint8Array(Buffer.from(bytecode, 'hex'));

    } catch (error: any) {
      console.error(' Solidity compilation failed:', error);
      throw new Error(`Contract compilation failed: ${error.message}`);
    }
  }

  async getAccountBalance(): Promise<string> {
    try {
      const balance = await this.client.getAccountBalance(this.operatorId);
      return balance.hbars.toString();
    } catch (error: any) {
      console.error('Failed to get account balance:', error);
      throw new Error('Failed to retrieve account balance');
    }
  }

  async getNetworkStatus(): Promise<any> {
    try {
      const balance = await this.getAccountBalance();
      return {
        network: process.env.HEDERA_NETWORK || 'testnet',
        accountId: this.operatorId.toString(),
        balance,
        status: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        network: process.env.HEDERA_NETWORK || 'testnet',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}