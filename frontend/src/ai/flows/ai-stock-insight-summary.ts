'use server';
/**
 * @fileOverview An AI agent that provides concise stock insight summaries.
 *
 * - getAiStockInsightSummary - A function that handles the AI stock insight summary process.
 * - AiStockInsightSummaryInput - The input type for the getAiStockInsightSummary function.
 * - AiStockInsightSummaryOutput - The return type for the getAiStockInsightSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiStockInsightSummaryInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol (e.g., "GOOGL").'),
  companyName: z.string().describe('The full name of the company.'),
  currentPrice: z.number().describe('The current trading price of the stock.'),
  marketCap: z
    .number()
    .describe('The current market capitalization of the company.'),
  peRatio: z
    .number()
    .nullable()
    .describe('The Price-to-Earnings ratio of the stock, or null if not available.'),
  fiftyTwoWeekHigh: z
    .number()
    .describe('The highest price the stock reached in the past 52 weeks.'),
  fiftyTwoWeekLow: z
    .number()
    .describe('The lowest price the stock reached in the past 52 weeks.'),
  sector: z.string().describe('The sector the company operates in (e.g., "Technology").'),
  industry: z.string().describe('The specific industry within the sector (e.g., "Software - Infrastructure").'),
  description: z.string().describe('A brief description of the company and its business.'),
});
export type AiStockInsightSummaryInput = z.infer<
  typeof AiStockInsightSummaryInputSchema
>;

const AiStockInsightSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, AI-generated summary of the stock.'),
  keyInsights: z
    .array(z.string())
    .describe('A list of key insights or trends identified by the AI.'),
  sentiment: z
    .enum(['positive', 'neutral', 'negative'])
    .describe('The overall sentiment towards the stock based on the provided data.'),
});
export type AiStockInsightSummaryOutput = z.infer<
  typeof AiStockInsightSummaryOutputSchema
>;

export async function getAiStockInsightSummary(
  input: AiStockInsightSummaryInput
): Promise<AiStockInsightSummaryOutput> {
  return aiStockInsightSummaryFlow(input);
}

const aiStockInsightSummaryPrompt = ai.definePrompt({
  name: 'aiStockInsightSummaryPrompt',
  input: {schema: AiStockInsightSummaryInputSchema},
  output: {schema: AiStockInsightSummaryOutputSchema},
  prompt: `You are an expert financial analyst. Your task is to provide a concise summary of a stock, highlight its key insights, and determine its overall sentiment based on the provided data. Focus on making informed decisions for an investor. The output must be in JSON format.

Here is the stock information:

Company Name: {{{companyName}}}
Ticker: {{{ticker}}}
Sector: {{{sector}}}
Industry: {{{industry}}}
Company Description: {{{description}}}

Financial Metrics:
Current Price: \${{{currentPrice}}}
Market Capitalization: \${{{marketCap}}}
PE Ratio: {{{peRatio}}}
52-Week High: \${{{fiftyTwoWeekHigh}}}
52-Week Low: \${{{fiftyTwoWeekLow}}}

Based on this data, provide:
1. A brief, objective summary of the stock.
2. A list of 3-5 key insights or trends relevant to an investor.
3. An overall sentiment (positive, neutral, or negative).
`,
});

const aiStockInsightSummaryFlow = ai.defineFlow(
  {
    name: 'aiStockInsightSummaryFlow',
    inputSchema: AiStockInsightSummaryInputSchema,
    outputSchema: AiStockInsightSummaryOutputSchema,
  },
  async input => {
    const {output} = await aiStockInsightSummaryPrompt(input);
    return output!;
  }
);
