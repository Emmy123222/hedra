export interface SecurityIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  description: string;
  location?: string;
  recommendation: string;
}

export interface SecurityReport {
  riskScore: number;
  issues: SecurityIssue[];
  summary: string;
  passedChecks: string[];
}

export class SecurityAuditor {
  auditContract(contractCode: string, parsedContract: any): SecurityReport {
    const issues: SecurityIssue[] = [];
    const passedChecks: string[] = [];

    // Check for common vulnerabilities
    this.checkReentrancy(contractCode, issues, passedChecks);
    this.checkTxOrigin(contractCode, issues, passedChecks);
    this.checkUncheckedCalls(contractCode, issues, passedChecks);
    this.checkOverflowUnderflow(contractCode, issues, passedChecks);
    this.checkAccessControl(contractCode, parsedContract, issues, passedChecks);
    this.checkRandomness(contractCode, issues, passedChecks);
    this.checkDenialOfService(contractCode, issues, passedChecks);
    this.checkTimeDependence(contractCode, issues, passedChecks);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(issues);

    return {
      riskScore,
      issues,
      summary: this.generateSummary(issues, riskScore),
      passedChecks
    };
  }

  private checkReentrancy(contractCode: string, issues: SecurityIssue[], passedChecks: string[]) {
    const hasExternalCalls = /\.call\(|\.transfer\(|\.send\(/g.test(contractCode);
    const hasStateChangesAfterCalls = this.hasStateChangesAfterExternalCalls(contractCode);

    if (hasExternalCalls && hasStateChangesAfterCalls) {
      issues.push({
        severity: 'HIGH',
        type: 'Reentrancy',
        description: 'Potential reentrancy vulnerability detected',
        recommendation: 'Use the checks-effects-interactions pattern or reentrancy guards'
      });
    } else {
      passedChecks.push('Reentrancy protection');
    }
  }

  private checkTxOrigin(contractCode: string, issues: SecurityIssue[], passedChecks: string[]) {
    if (/tx\.origin/g.test(contractCode)) {
      issues.push({
        severity: 'MEDIUM',
        type: 'tx.origin Usage',
        description: 'Use of tx.origin for authorization',
        recommendation: 'Use msg.sender instead of tx.origin for authorization'
      });
    } else {
      passedChecks.push('No tx.origin usage');
    }
  }

  private checkUncheckedCalls(contractCode: string, issues: SecurityIssue[], passedChecks: string[]) {
    const uncheckedCalls = contractCode.match(/\.call\([^)]*\)\s*;/g);
    
    if (uncheckedCalls && uncheckedCalls.length > 0) {
      issues.push({
        severity: 'MEDIUM',
        type: 'Unchecked Call',
        description: 'External calls without return value checking',
        recommendation: 'Always check return values of external calls'
      });
    } else {
      passedChecks.push('External call return values checked');
    }
  }

  private checkOverflowUnderflow(contractCode: string, issues: SecurityIssue[], passedChecks: string[]) {
    const hasSafeMath = /SafeMath|using.*for.*uint/g.test(contractCode);
    const hasPragma08 = /pragma solidity.*0\.8/g.test(contractCode);
    const hasArithmetic = /[\+\-\*\/]/g.test(contractCode);

    if (hasArithmetic && !hasSafeMath && !hasPragma08) {
      issues.push({
        severity: 'HIGH',
        type: 'Integer Overflow/Underflow',
        description: 'Arithmetic operations without overflow protection',
        recommendation: 'Use SafeMath library or Solidity 0.8+ with built-in checks'
      });
    } else {
      passedChecks.push('Overflow protection implemented');
    }
  }

  private checkAccessControl(contractCode: string, parsedContract: any, issues: SecurityIssue[], passedChecks: string[]) {
    const hasOnlyOwner = /onlyOwner|onlyAdmin/g.test(contractCode);
    const hasPublicFunctions = parsedContract.functions.some((f: any) => f.visibility === 'public');

    if (hasPublicFunctions && !hasOnlyOwner) {
      issues.push({
        severity: 'MEDIUM',
        type: 'Access Control',
        description: 'Public functions without proper access control',
        recommendation: 'Implement proper access control modifiers for sensitive functions'
      });
    } else {
      passedChecks.push('Access control implemented');
    }
  }

  private checkRandomness(contractCode: string, issues: SecurityIssue[], passedChecks: string[]) {
    if (/block\.timestamp|block\.difficulty|block\.number.*random/gi.test(contractCode)) {
      issues.push({
        severity: 'MEDIUM',
        type: 'Weak Randomness',
        description: 'Use of predictable randomness sources',
        recommendation: 'Use commit-reveal schemes or oracle-based randomness'
      });
    } else {
      passedChecks.push('No weak randomness detected');
    }
  }

  private checkDenialOfService(contractCode: string, issues: SecurityIssue[], passedChecks: string[]) {
    const hasUnboundedLoops = /for\s*\([^}]*\{[^}]*\}/g.test(contractCode) && 
                             !/break;|return;/g.test(contractCode);

    if (hasUnboundedLoops) {
      issues.push({
        severity: 'MEDIUM',
        type: 'Denial of Service',
        description: 'Unbounded loops that could cause gas limit DoS',
        recommendation: 'Implement pagination or limit loop iterations'
      });
    } else {
      passedChecks.push('No unbounded loops detected');
    }
  }

  private checkTimeDependence(contractCode: string, issues: SecurityIssue[], passedChecks: string[]) {
    if (/block\.timestamp.*require|block\.number.*require/gi.test(contractCode)) {
      issues.push({
        severity: 'LOW',
        type: 'Time Dependence',
        description: 'Logic depends on block timestamp which can be manipulated',
        recommendation: 'Avoid strict timestamp requirements or use time ranges'
      });
    } else {
      passedChecks.push('No critical time dependencies');
    }
  }

  private hasStateChangesAfterExternalCalls(contractCode: string): boolean {
    // Simplified check - in production, you'd need proper AST analysis
    return /\.call\([^}]*\}[^}]*=\s*\w+/g.test(contractCode);
  }

  private calculateRiskScore(issues: SecurityIssue[]): number {
    let score = 0;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'CRITICAL': score += 25; break;
        case 'HIGH': score += 15; break;
        case 'MEDIUM': score += 8; break;
        case 'LOW': score += 3; break;
      }
    });

    return Math.min(100, score);
  }

  private generateSummary(issues: SecurityIssue[], riskScore: number): string {
    if (riskScore === 0) {
      return 'No security issues detected. Contract appears to follow security best practices.';
    }

    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const highCount = issues.filter(i => i.severity === 'HIGH').length;
    const mediumCount = issues.filter(i => i.severity === 'MEDIUM').length;
    const lowCount = issues.filter(i => i.severity === 'LOW').length;

    let summary = `Security audit found ${issues.length} issue(s) with a risk score of ${riskScore}/100. `;

    if (criticalCount > 0) summary += `${criticalCount} critical, `;
    if (highCount > 0) summary += `${highCount} high, `;
    if (mediumCount > 0) summary += `${mediumCount} medium, `;
    if (lowCount > 0) summary += `${lowCount} low severity issues. `;

    if (riskScore > 50) {
      summary += 'Immediate attention and fixes recommended before deployment.';
    } else if (riskScore > 20) {
      summary += 'Review and address issues before production deployment.';
    } else {
      summary += 'Minor issues detected, review recommended.';
    }

    return summary;
  }
}