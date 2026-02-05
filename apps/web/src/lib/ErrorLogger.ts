import { supabase } from './supabase';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorLogParams {
    message: string;
    error?: unknown;
    severity?: ErrorSeverity;
    context?: Record<string, unknown>;
}

class ErrorLogger {
    static async log({ message, error, severity = 'error', context = {} }: ErrorLogParams) {
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
             console.log(`[${severity.toUpperCase()}] ${message}`, error, context);
        }

        try {
            // Log to Supabase error_logs table
            const { error: dbError } = await supabase.from('error_logs').insert([{
                level: severity === 'warning' ? 'warn' : severity,
                message: message,
                details: {
                    error: error instanceof Error ? {
                        message: error.message,
                        stack: error.stack,
                        name: error.name
                    } : error,
                    context: context
                },
                created_at: new Date().toISOString()
            }]);

            if (dbError) {
                // Fail silently to avoid infinite loops or blocking the UI
                console.error('Error logging to database:', dbError);
            }
        } catch (e) {
            console.error('Critical failure in ErrorLogger:', e);
        }
    }

    static error(message: string, error?: unknown, context?: Record<string, unknown>) {
        this.log({ message, error, severity: 'error', context });
    }

    static warning(message: string, context?: Record<string, unknown>) {
        this.log({ message, severity: 'warning', context });
    }

    static info(message: string, context?: Record<string, unknown>) {
        this.log({ message, severity: 'info', context });
    }
}

export default ErrorLogger;
