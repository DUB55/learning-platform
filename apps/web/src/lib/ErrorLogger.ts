type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorLogParams {
    message: string;
    error?: any;
    severity?: ErrorSeverity;
    context?: Record<string, any>;
}

class ErrorLogger {
    static log({ message, error, severity = 'error', context = {} }: ErrorLogParams) {
        const timestamp = new Date().toISOString();

        // In development, log to console with rich formatting
        if (process.env.NODE_ENV === 'development') {
            const colorMap = {
                info: '\x1b[36m', // Cyan
                warning: '\x1b[33m', // Yellow
                error: '\x1b[31m', // Red
                critical: '\x1b[41m\x1b[37m', // White on Red
            };
            const reset = '\x1b[0m';

            console.group(`${colorMap[severity]}[${severity.toUpperCase()}] ${message}${reset}`);
            console.log('Timestamp:', timestamp);
            if (error) console.error('Error:', error);
            if (Object.keys(context).length > 0) console.log('Context:', context);
            console.groupEnd();
        }

        // In production, this would send to Sentry, LogRocket, etc.
        // For now, we'll just log to console as well but formatted for ingestion
        if (process.env.NODE_ENV === 'production') {
            console.log(JSON.stringify({
                timestamp,
                severity,
                message,
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error,
                context
            }));
        }
    }

    static error(message: string, error?: any, context?: Record<string, any>) {
        this.log({ message, error, severity: 'error', context });
    }

    static warning(message: string, context?: Record<string, any>) {
        this.log({ message, severity: 'warning', context });
    }

    static info(message: string, context?: Record<string, any>) {
        this.log({ message, severity: 'info', context });
    }
}

export default ErrorLogger;
