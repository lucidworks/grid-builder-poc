export declare class BlogImage {
    src: string;
    alt: string;
    caption?: string;
    objectFit: 'contain' | 'cover';
    imageLoaded: boolean;
    imageError: boolean;
    private imgRef?;
    componentDidLoad(): void;
    private handleImageLoad;
    private handleImageError;
    render(): any;
}
