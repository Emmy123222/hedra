export interface StoredAnalysis {
  id: string;
  contractName: string;
  originalFilename: string;
  riskScore: number;
  timestamp: string;
  status: 'analyzed' | 'deployed' | 'verified';
  fileId?: string;
  contractId?: string;
  transactionId?: string;
  summary: any;
  securityReport: any;
}

export class AnalysisStorage {
  private analyses: Map<string, StoredAnalysis> = new Map();

  storeAnalysis(analysis: StoredAnalysis): void {
    this.analyses.set(analysis.id, analysis);
    console.log(`📁 Stored analysis: ${analysis.id} - ${analysis.contractName}`);
  }

  getAnalysis(id: string): StoredAnalysis | undefined {
    return this.analyses.get(id);
  }

  updateAnalysisStatus(id: string, status: 'analyzed' | 'deployed' | 'verified', additionalData?: any): void {
    const analysis = this.analyses.get(id);
    if (analysis) {
      analysis.status = status;
      if (additionalData) {
        Object.assign(analysis, additionalData);
      }
      this.analyses.set(id, analysis);
      console.log(`🔄 Updated analysis ${id} status to: ${status}`);
    }
  }

  getRecentAnalyses(limit: number = 10): StoredAnalysis[] {
    const allAnalyses = Array.from(this.analyses.values());
    return allAnalyses
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  getAllAnalyses(): StoredAnalysis[] {
    return Array.from(this.analyses.values());
  }

  getAnalysisCount(): number {
    return this.analyses.size;
  }

  getDeployedCount(): number {
    return Array.from(this.analyses.values()).filter(a => a.status === 'deployed' || a.status === 'verified').length;
  }

  getAverageRiskScore(): number {
    const analyses = Array.from(this.analyses.values());
    if (analyses.length === 0) return 0;
    
    const totalRisk = analyses.reduce((sum, analysis) => sum + analysis.riskScore, 0);
    return Math.round(totalRisk / analyses.length);
  }

  getHighRiskCount(): number {
    return Array.from(this.analyses.values()).filter(a => a.riskScore >= 70).length;
  }
}