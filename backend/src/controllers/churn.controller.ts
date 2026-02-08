import { Response } from 'express';
import { AuthRequest } from '../types';
import {
    trainModel,
    predictChurn,
    batchPredictAndUpdate,
    getAtRiskSubscriptions,
} from '../services/churn.service';

// POST /api/churn/train — Train the logistic regression model on historical data
export const handleTrainModel = async (req: AuthRequest, res: Response) => {
    try {
        const result = await trainModel();
        res.json(result);
    } catch (error: any) {
        console.error('Train churn model error:', error);
        res.status(400).json({ error: error.message || 'Failed to train churn model' });
    }
};

// GET /api/churn/predict/:subscriptionId — Predict churn for a single subscription
export const handlePredictSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const prediction = await predictChurn(subscriptionId);
        res.json(prediction);
    } catch (error: any) {
        console.error('Predict churn error:', error);
        res.status(400).json({ error: error.message || 'Failed to predict churn' });
    }
};

// POST /api/churn/predict-all — Run batch prediction on all active subscriptions
export const handleBatchPredict = async (req: AuthRequest, res: Response) => {
    try {
        const result = await batchPredictAndUpdate();
        res.json(result);
    } catch (error: any) {
        console.error('Batch predict churn error:', error);
        res.status(400).json({ error: error.message || 'Failed to run batch prediction' });
    }
};

// GET /api/churn/at-risk — Get all high-risk and critical-risk subscriptions
export const handleGetAtRisk = async (req: AuthRequest, res: Response) => {
    try {
        const subscriptions = await getAtRiskSubscriptions();
        res.json(subscriptions);
    } catch (error: any) {
        console.error('Get at-risk subscriptions error:', error);
        res.status(500).json({ error: error.message || 'Failed to get at-risk subscriptions' });
    }
};
