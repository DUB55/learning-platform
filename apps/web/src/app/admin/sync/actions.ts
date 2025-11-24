'use server';

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type CommitInfo = {
    hash: string;
    author: string;
    date: string;
    message: string;
};

export async function getGitHistory(): Promise<CommitInfo[]> {
    try {
        // Format: hash|author|date|message
        const { stdout } = await execAsync('git log -n 10 --pretty=format:"%h|%an|%ar|%s"');

        return stdout.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const [hash, author, date, message] = line.split('|');
                return { hash, author, date, message };
            });
    } catch (error) {
        console.error('Error fetching git history:', error);
        return [];
    }
}
