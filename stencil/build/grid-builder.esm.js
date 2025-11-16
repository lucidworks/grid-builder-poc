import { B as BUILD, c as consoleDevInfo, H, d as doc, N as NAMESPACE, p as promiseResolve, b as bootstrapLazy } from './index-ebe9feb4.js';
export { s as setNonce } from './index-ebe9feb4.js';
import { g as globalScripts } from './app-globals-0f993ce5.js';

/*
 Stencil Client Patch Browser v4.8.2 | MIT Licensed | https://stenciljs.com
 */
const patchBrowser = () => {
    // NOTE!! This fn cannot use async/await!
    if (BUILD.isDev && !BUILD.isTesting) {
        consoleDevInfo('Running in development mode.');
    }
    if (BUILD.cloneNodeFix) {
        // opted-in to polyfill cloneNode() for slot polyfilled components
        patchCloneNodeFix(H.prototype);
    }
    const scriptElm = BUILD.scriptDataOpts
        ? Array.from(doc.querySelectorAll('script')).find((s) => new RegExp(`\/${NAMESPACE}(\\.esm)?\\.js($|\\?|#)`).test(s.src) ||
            s.getAttribute('data-stencil-namespace') === NAMESPACE)
        : null;
    const importMeta = import.meta.url;
    const opts = BUILD.scriptDataOpts ? (scriptElm || {})['data-opts'] || {} : {};
    if (importMeta !== '') {
        opts.resourcesUrl = new URL('.', importMeta).href;
    }
    return promiseResolve(opts);
};
const patchCloneNodeFix = (HTMLElementPrototype) => {
    const nativeCloneNodeFn = HTMLElementPrototype.cloneNode;
    HTMLElementPrototype.cloneNode = function (deep) {
        if (this.nodeName === 'TEMPLATE') {
            return nativeCloneNodeFn.call(this, deep);
        }
        const clonedNode = nativeCloneNodeFn.call(this, false);
        const srcChildNodes = this.childNodes;
        if (deep) {
            for (let i = 0; i < srcChildNodes.length; i++) {
                // Node.ATTRIBUTE_NODE === 2, and checking because IE11
                if (srcChildNodes[i].nodeType !== 2) {
                    clonedNode.appendChild(srcChildNodes[i].cloneNode(true));
                }
            }
        }
        return clonedNode;
    };
};

patchBrowser().then(options => {
  globalScripts();
  return bootstrapLazy([["canvas-section",[[0,"canvas-section",{"canvasId":[1,"canvas-id"],"sectionNumber":[2,"section-number"],"canvas":[32],"renderVersion":[32]}]]],["component-palette",[[0,"component-palette"]]],["config-panel",[[0,"config-panel",{"isOpen":[32],"selectedItemId":[32],"selectedCanvasId":[32],"componentName":[32]},[[4,"item-click","handleItemClick"]]]]],["component-button",[[0,"component-button",{"itemId":[1,"item-id"]}]]],["component-dashboard-widget",[[0,"component-dashboard-widget",{"itemId":[1,"item-id"]}]]],["component-header",[[0,"component-header",{"itemId":[1,"item-id"]}]]],["component-image",[[0,"component-image",{"itemId":[1,"item-id"]}]]],["component-image-gallery",[[0,"component-image-gallery",{"itemId":[1,"item-id"]}]]],["component-live-data",[[0,"component-live-data",{"itemId":[1,"item-id"],"value":[32]}]]],["component-text-block",[[0,"component-text-block",{"itemId":[1,"item-id"]}]]],["component-video",[[0,"component-video",{"itemId":[1,"item-id"],"showVideo":[32]}]]],["grid-item-wrapper",[[0,"grid-item-wrapper",{"item":[16],"renderVersion":[2,"render-version"],"isSelected":[32],"isVisible":[32]}]]],["grid-builder-app",[[0,"grid-builder-app",{"itemCount":[32]},[[4,"canvas-drop","handleCanvasDrop"],[4,"item-delete","handleItemDelete"],[4,"canvas-move","handleCanvasMove"]]]]]], options);
});

//# sourceMappingURL=grid-builder.esm.js.map