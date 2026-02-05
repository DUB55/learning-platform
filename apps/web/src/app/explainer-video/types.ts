export interface ExplainerScript {
    title: string;
    duration: number; // in seconds
    segments: ExplainerSegment[];
}

export interface ExplainerSegment {
    startTime: number;
    endTime: number;
    text: string;
    visualAction: 'show_slide' | 'show_bullet' | 'show_image' | 'highlight_text' | 'show_quote' | 'show_definition';
    visualData: {
        title?: string;
        content?: string[];
        imageUrl?: string;
        highlight?: string;
        author?: string;
        term?: string;
        definition?: string;
    };
}
