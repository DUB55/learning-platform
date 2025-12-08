/**
 * Generates a Pollinations AI image URL with the user's specific requirements.
 * Ensures no logo is present.
 */
export function generatePollinationsUrl(prompt: string, options?: {
    width?: number;
    height?: number;
    model?: string;
    seed?: number;
}): string {
    const encodedPrompt = encodeURIComponent(prompt);
    const params = new URLSearchParams();

    params.append('nologo', 'true'); // Critical requirement
    if (options?.width) params.append('width', options.width.toString());
    if (options?.height) params.append('height', options.height.toString());
    if (options?.model) params.append('model', options.model);
    if (options?.seed) params.append('seed', options.seed.toString());

    return `https://image.pollinations.ai/prompt/${encodedPrompt}?${params.toString()}`;
}
