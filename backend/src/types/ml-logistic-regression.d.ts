declare module 'ml-logistic-regression' {
    import { Matrix } from 'ml-matrix';

    interface LogisticRegressionOptions {
        numSteps?: number;
        learningRate?: number;
    }

    interface LogisticRegressionTwoClasses {
        weights: Matrix;
        testScores(features: Matrix): Matrix;
        predict(features: Matrix): Matrix;
    }

    class LogisticRegression {
        classifiers: LogisticRegressionTwoClasses[];
        numberClasses: number;
        constructor(options?: LogisticRegressionOptions);
        train(X: Matrix, Y: Matrix): void;
        predict(X: Matrix): number[];
        toJSON(): any;
        static load(model: any): LogisticRegression;
    }

    export default LogisticRegression;
}
