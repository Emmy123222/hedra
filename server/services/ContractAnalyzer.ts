import * as Parser from 'solidity-parser-antlr';

export interface ParsedContract {
  contractName: string;
  functions: any[];
  events: any[];
  modifiers: any[];
  variables: any[];
  imports: string[];
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class ContractAnalyzer {
  parseContract(contractCode: string): ParsedContract {
    try {
      const ast = Parser.parse(contractCode, {
        loc: true,
        range: true
      });

      const result: ParsedContract = {
        contractName: 'Unknown',
        functions: [],
        events: [],
        modifiers: [],
        variables: [],
        imports: [],
        complexity: 'LOW'
      };

      // Visit AST nodes
      Parser.visit(ast, {
        ContractDefinition: (node: any) => {
          result.contractName = node.name;
        },
        FunctionDefinition: (node: any) => {
          result.functions.push({
            name: node.name,
            visibility: node.visibility,
            mutability: node.stateMutability,
            parameters: node.parameters,
            returnParameters: node.returnParameters
          });
        },
        EventDefinition: (node: any) => {
          result.events.push({
            name: node.name,
            parameters: node.parameters
          });
        },
        ModifierDefinition: (node: any) => {
          result.modifiers.push({
            name: node.name,
            parameters: node.parameters
          });
        },
        StateVariableDeclaration: (node: any) => {
          result.variables.push({
            variables: node.variables,
            visibility: node.visibility
          });
        },
        ImportDirective: (node: any) => {
          result.imports.push(node.path);
        }
      });

      // Calculate complexity
      result.complexity = this.calculateComplexity(result);

      return result;

    } catch (error) {
      console.error('Contract parsing error:', error);
      
      // Return minimal parsed result
      return {
        contractName: this.extractContractName(contractCode),
        functions: [],
        events: [],
        modifiers: [],
        variables: [],
        imports: [],
        complexity: 'HIGH' // Assume high complexity if parsing fails
      };
    }
  }

  private calculateComplexity(parsed: ParsedContract): 'LOW' | 'MEDIUM' | 'HIGH' {
    let complexityScore = 0;

    // Function count contributes to complexity
    complexityScore += parsed.functions.length * 2;
    
    // State variables add complexity
    complexityScore += parsed.variables.length;
    
    // Events and modifiers add some complexity
    complexityScore += parsed.events.length + parsed.modifiers.length;
    
    // External dependencies increase complexity
    complexityScore += parsed.imports.length * 3;

    if (complexityScore < 10) return 'LOW';
    if (complexityScore < 25) return 'MEDIUM';
    return 'HIGH';
  }

  private extractContractName(contractCode: string): string {
    const contractMatch = contractCode.match(/contract\s+(\w+)/);
    return contractMatch ? contractMatch[1] : 'UnknownContract';
  }

  analyzeGasUsage(contractCode: string): any {
    // Simplified gas analysis
    const gasPatterns = {
      loops: (contractCode.match(/for\s*\(|while\s*\(/g) || []).length,
      externalCalls: (contractCode.match(/\.call\(|\.delegatecall\(|\.staticcall\(/g) || []).length,
      storageOperations: (contractCode.match(/storage\s+\w+|mapping\s*\(/g) || []).length
    };

    let gasRisk = 'LOW';
    if (gasPatterns.loops > 3 || gasPatterns.externalCalls > 5) {
      gasRisk = 'HIGH';
    } else if (gasPatterns.loops > 1 || gasPatterns.externalCalls > 2) {
      gasRisk = 'MEDIUM';
    }

    return {
      gasRisk,
      patterns: gasPatterns,
      recommendations: this.getGasRecommendations(gasRisk, gasPatterns)
    };
  }

  private getGasRecommendations(gasRisk: string, patterns: any): string[] {
    const recommendations = [];

    if (patterns.loops > 1) {
      recommendations.push('Consider limiting loop iterations to prevent gas limit issues');
    }
    
    if (patterns.externalCalls > 2) {
      recommendations.push('Review external calls for reentrancy protection');
    }
    
    if (patterns.storageOperations > 5) {
      recommendations.push('Optimize storage operations to reduce gas costs');
    }

    if (gasRisk === 'HIGH') {
      recommendations.push('Comprehensive gas optimization review recommended');
    }

    return recommendations;
  }
}