export declare class LiveData {
    temperature: string;
    cpu: string;
    memory: string;
    updateCount: number;
    lastUpdate: string;
    private intervalId?;
    componentDidLoad(): void;
    disconnectedCallback(): void;
    private updateData;
    render(): any;
}
