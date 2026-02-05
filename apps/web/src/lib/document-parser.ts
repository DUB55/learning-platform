// @ts-expect-error Import type mismatch for pdf-parse default export
import pdf from 'pdf-parse';
import Tesseract from 'tesseract.js';
import ErrorLogger from './ErrorLogger';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        ErrorLogger.error('PDF Parse Error', error);
        throw new Error('Failed to parse PDF file');
    }
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    try {
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng+nld', {
            logger: m => console.log(m)
        });
        return text;
    } catch (error) {
        ErrorLogger.error('OCR Error', error);
        throw new Error('Failed to extract text from image');
    }
}
