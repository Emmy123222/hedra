import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarizeContract(contractCode: string): Promise<any> {
    try {
      const prompt = `
        Analyze this Solidity smart contract and provide a comprehensive legal summary:

        ${contractCode}

        Please provide:
        1. A plain English summary of what this contract does
        2. Key functions and their purposes
        3. Access controls and permissions
        4. Potential legal implications
        5. Compliance considerations
        6. Risk assessment from a legal perspective

        Format the response as JSON with the following structure:
        {
          "summary": "Plain English description",
          "keyFunctions": ["function1", "function2"],
          "accessControls": "Description of access controls",
          "legalImplications": ["implication1", "implication2"],
          "complianceNotes": "Compliance considerations",
          "legalRiskLevel": "LOW/MEDIUM/HIGH"
        }
      `;

      const completion = await this.openai.chat.completions.create({
  model: "gpt-3.5-turbo", // <-- change here
        messages: [
          {
            role: "system",
            content: "You are a legal expert specializing in smart contract analysis and blockchain law."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI service');
      }

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        summary: response,
        keyFunctions: [],
        accessControls: "Analysis pending",
        legalImplications: [],
        complianceNotes: "Review required",
        legalRiskLevel: "MEDIUM"
      };

    } catch (error) {
      console.error('AI analysis error:', error);
      
      // Return fallback analysis
      return {
        summary: "Contract analysis unavailable - please review manually",
        keyFunctions: ["Manual review required"],
        accessControls: "Unable to determine",
        legalImplications: ["Manual legal review recommended"],
        complianceNotes: "Professional legal advice suggested",
        legalRiskLevel: "HIGH"
      };
    }
  }

  async generateRiskReport(securityIssues: any[], contractComplexity: string): Promise<any> {
    try {
      const prompt = `
        Generate a legal risk assessment report based on these security findings and contract complexity:

        Security Issues: ${JSON.stringify(securityIssues)}
        Contract Complexity: ${contractComplexity}

        Provide a comprehensive legal risk analysis focusing on:
        1. Liability concerns
        2. Regulatory compliance risks
        3. Financial exposure
        4. Operational risks
        5. Recommendations for risk mitigation

        Format as JSON with risk levels and actionable recommendations.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a legal risk analyst specializing in smart contract compliance and regulatory affairs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from risk analysis');
      }

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        overallRisk: "MEDIUM",
        recommendations: ["Professional legal review recommended"],
        liabilityScore: 5,
        complianceScore: 5
      };

    } catch (error) {
      console.error('Risk analysis error:', error);
      
      return {
        overallRisk: "HIGH",
        recommendations: ["Immediate legal review required due to analysis failure"],
        liabilityScore: 8,
        complianceScore: 8
      };
    }
  }
}