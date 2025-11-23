import { EventEmitter } from '../../../stencil-public-runtime';
export declare class BlogButton {
    label: string;
    variant: 'primary' | 'secondary';
    href?: string;
    buttonClick: EventEmitter<void>;
    private handleClick;
    render(): any;
}
