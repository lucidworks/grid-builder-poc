import { r as registerInstance, h } from './index-ebe9feb4.js';
import { i as interact_min } from './interact.min-bef33ec6.js';
import { c as componentTemplates } from './component-templates-e71f1a8f.js';
import { a as undoRedoState, u as undo, r as redo } from './undo-redo-27e9fef6.js';
import { g as gridToPixelsX, b as gridToPixelsY } from './grid-calculations-54c868d5.js';
import './index-28d0c3f6.js';

const componentPaletteCss = ".palette{width:250px;padding:20px;border-right:1px solid #ddd;background:white;overflow-y:auto}.palette h2{margin-bottom:20px;color:#333;font-size:18px}.palette-item{padding:15px;border-radius:4px;margin-bottom:10px;background:#4a90e2;color:white;cursor:move;font-weight:500;text-align:center;transition:transform 0.2s, box-shadow 0.2s;user-select:none}.palette-item:hover{box-shadow:0 4px 8px rgba(0, 0, 0, 10%);transform:translateY(-2px)}.palette-item.dragging-from-palette{opacity:0.5}.dragging-clone{position:fixed;z-index:10000;width:200px;height:150px;padding:20px;border-radius:4px;background:rgba(74, 144, 226, 90%);box-shadow:0 4px 12px rgba(0, 0, 0, 20%);color:white;pointer-events:none}.history-controls{display:flex;margin-top:10px;gap:8px}.history-btn{flex:1;padding:10px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s}.history-btn:disabled{cursor:not-allowed;opacity:0.4}.history-btn:hover:not(:disabled){border-color:#4a90e2;background:#f5f5f5;color:#4a90e2}";

const ComponentPalette = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    componentWillLoad() {
        // Subscribe to undo/redo state changes
        // The undoRedoState from @stencil/store is already reactive
    }
    componentDidLoad() {
        // Initialize drag functionality for palette items
        this.initializePaletteItems();
    }
    render() {
        const simpleComponents = Object.entries(componentTemplates).filter(([, template]) => !template.complex);
        const complexComponents = Object.entries(componentTemplates).filter(([, template]) => template.complex);
        return (h("div", { class: "palette" }, h("h2", null, "Components"), simpleComponents.map(([type, template]) => (h("div", { class: "palette-item", "data-component-type": type, key: type }, template.icon, " ", template.title))), h("h2", { style: {
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #ddd',
            } }, "Complex"), complexComponents.map(([type, template]) => (h("div", { class: "palette-item", "data-component-type": type, key: type }, template.icon, " ", template.title))), h("h2", { style: {
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid #ddd',
            } }, "History"), h("div", { class: "history-controls" }, h("button", { id: "undoBtn", class: "history-btn", title: "Undo (Ctrl+Z)", disabled: !undoRedoState.canUndo, onClick: () => undo() }, "\u21B6 Undo"), h("button", { id: "redoBtn", class: "history-btn", title: "Redo (Ctrl+Y)", disabled: !undoRedoState.canRedo, onClick: () => redo() }, "\u21B7 Redo"))));
    }
    initializePaletteItems() {
        const paletteItems = document.querySelectorAll('.palette-item');
        paletteItems.forEach((element) => {
            interact_min(element).draggable({
                inertia: false,
                autoScroll: false,
                listeners: {
                    start: (event) => {
                        event.target.classList.add('dragging-from-palette');
                        // Get component type and template
                        const componentType = event.target.getAttribute('data-component-type');
                        const template = componentTemplates[componentType];
                        // Calculate actual component size (default: 10 units wide, 6 units tall)
                        // Use canvas1 for width calculation (responsive grid)
                        const defaultWidth = 10;
                        const defaultHeight = 6;
                        const widthPx = gridToPixelsX(defaultWidth, 'canvas1');
                        const heightPx = gridToPixelsY(defaultHeight);
                        const halfWidth = widthPx / 2;
                        const halfHeight = heightPx / 2;
                        // Create drag clone with actual component size
                        const dragClone = document.createElement('div');
                        dragClone.className = 'dragging-clone';
                        dragClone.style.position = 'fixed';
                        dragClone.style.width = widthPx + 'px';
                        dragClone.style.height = heightPx + 'px';
                        dragClone.style.left = event.clientX - halfWidth + 'px';
                        dragClone.style.top = event.clientY - halfHeight + 'px';
                        dragClone.style.padding = '20px 20px 20px 44px';
                        dragClone.style.background = 'rgba(74, 144, 226, 0.9)';
                        dragClone.style.color = 'white';
                        dragClone.style.borderRadius = '4px';
                        dragClone.style.pointerEvents = 'none';
                        dragClone.style.zIndex = '10000';
                        dragClone.innerHTML = `
                <div style="font-weight: 600; color: #fff; margin-bottom: 5px; font-size: 14px;">${template.icon} ${template.title}</div>
              `;
                        document.body.appendChild(dragClone);
                        // Store clone reference and half dimensions for move event
                        event.target._dragClone = dragClone;
                        event.target._halfWidth = halfWidth;
                        event.target._halfHeight = halfHeight;
                    },
                    move: (event) => {
                        const dragClone = event.target._dragClone;
                        const halfWidth = event.target._halfWidth;
                        const halfHeight = event.target._halfHeight;
                        if (dragClone) {
                            dragClone.style.left = event.clientX - halfWidth + 'px';
                            dragClone.style.top = event.clientY - halfHeight + 'px';
                        }
                    },
                    end: (event) => {
                        event.target.classList.remove('dragging-from-palette');
                        const dragClone = event.target._dragClone;
                        if (dragClone) {
                            dragClone.remove();
                            delete event.target._dragClone;
                        }
                    },
                },
            });
        });
    }
};
ComponentPalette.style = componentPaletteCss;

export { ComponentPalette as component_palette };

//# sourceMappingURL=component-palette.entry.js.map