import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TaxSuggestion {
    taxName: string;
    rate: number;
    taxType: string;
    confidence: number;
    reason: string;
}

interface GeminiTaxResult {
    taxName: string;
    rate: number;
    taxType: string;
    reason: string;
}

// Call Gemini API for tax rate suggestion
export const suggestTaxWithGemini = async (
    taxName: string,
    country: string,
    state: string | null
): Promise<GeminiTaxResult | null> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not configured');
        return null;
    }

    const prompt = `You are a tax expert. Given the following tax details, provide the current applicable tax rate.

Tax Name/Type: ${taxName}
Country: ${country}
${state ? `State/Region: ${state}` : ''}

Respond ONLY with a valid JSON object (no markdown, no code blocks, no explanation outside JSON) in this exact format:
{
  "taxName": "the official tax name",
  "rate": <number - the tax rate percentage>,
  "taxType": "the tax category like GST, VAT, Sales Tax, etc.",
  "reason": "brief explanation of why this rate applies"
}

If the tax type is GST in India, provide the standard GST rate. If a state is provided, check for state-specific rates.
For combined taxes (like CGST+SGST), provide the total combined rate.
Always return the most commonly applicable rate for the given context.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 500,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Gemini API error:', response.status, errorBody);
            return null;
        }

        const data = await response.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('No response text from Gemini');
            return null;
        }

        // Parse JSON from response (handle potential markdown wrapping)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Could not parse JSON from Gemini response:', text);
            return null;
        }

        const result = JSON.parse(jsonMatch[0]) as GeminiTaxResult;
        return result;
    } catch (error) {
        console.error('Gemini API call failed:', error);
        return null;
    }
};

// AI-powered tax suggestion based on location and product type
export const suggestTax = async (
    country: string,
    state: string | null,
    productType: string
): Promise<TaxSuggestion[]> => {
    const suggestions: TaxSuggestion[] = [];

    // Location-based tax rate lookup (simplified AI logic)
    const taxRules: Record<string, any> = {
        'India': {
            'GST': { rate: 18, types: ['Service', 'Digital'] },
            'CGST+SGST': { rate: 9 + 9, types: ['Physical'] },
        },
        'USA': {
            'Sales Tax': { rate: 7, types: ['Physical'] },
            'Digital Services Tax': { rate: 5, types: ['Digital', 'Service'] },
        },
        'UK': {
            'VAT': { rate: 20, types: ['Service', 'Physical', 'Digital'] },
        },
    };

    // Check if country has tax rules
    if (taxRules[country]) {
        for (const [taxType, config] of Object.entries(taxRules[country]) as [string, { rate: number; types: string[] }][]) {
            if (config.types.includes(productType)) {
                suggestions.push({
                    taxName: `${country} ${taxType}`,
                    rate: config.rate,
                    taxType,
                    confidence: 0.9,
                    reason: `Standard ${taxType} for ${productType} in ${country}`,
                });
            }
        }
    }

    // Check historical patterns
    const historicalTaxes = await prisma.tax.findMany({
        where: {
            country,
            isActive: true,
        },
    });

    for (const tax of historicalTaxes) {
        if (!suggestions.find(s => s.rate === tax.rate)) {
            suggestions.push({
                taxName: tax.name,
                rate: tax.rate,
                taxType: tax.taxType,
                confidence: 0.7,
                reason: `Previously used tax configuration for ${country}`,
            });
        }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return suggestions;
};

// Validate tax rate (anomaly detection)
export const validateTaxRate = (rate: number, country: string): { valid: boolean; warnings: string[] } => {
    const warnings: string[] = [];

    // Common tax rate ranges
    if (rate < 0 || rate > 50) {
        warnings.push('Tax rate outside typical range (0-50%)');
    }

    if (rate > 30) {
        warnings.push('Unusually high tax rate detected');
    }

    // Country-specific validation
    if (country === 'India' && ![5, 12, 18, 28].includes(rate)) {
        warnings.push('Non-standard GST rate for India (typical: 5%, 12%, 18%, 28%)');
    }

    if (country === 'UK' && ![0, 5, 20].includes(rate)) {
        warnings.push('Non-standard VAT rate for UK (typical: 0%, 5%, 20%)');
    }

    return {
        valid: warnings.length === 0,
        warnings,
    };
};

// Calculate applicable taxes for an invoice
export const calculateApplicableTaxes = async (
    customerId: string,
    productIds: string[]
): Promise<any[]> => {
    const customer = await prisma.user.findUnique({
        where: { id: customerId },
    });

    if (!customer) {
        return [];
    }

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
    });

    const applicableTaxes: any[] = [];

    for (const product of products) {
        const suggestions = await suggestTax(
            customer.country || 'India',
            customer.state,
            product.productType
        );

        if (suggestions.length > 0) {
            applicableTaxes.push({
                productId: product.id,
                productName: product.name,
                suggestedTax: suggestions[0],
                alternatives: suggestions.slice(1, 3),
            });
        }
    }

    return applicableTaxes;
};
