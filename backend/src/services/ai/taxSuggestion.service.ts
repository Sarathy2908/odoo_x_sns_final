import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TaxSuggestion {
    taxName: string;
    rate: number;
    taxType: string;
    confidence: number;
    reason: string;
}

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
