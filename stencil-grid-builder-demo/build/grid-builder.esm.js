import { B as BUILD, c as consoleDevInfo, H, w as win, N as NAMESPACE, p as promiseResolve, g as globalScripts, b as bootstrapLazy } from './index-CoCbyscT.js';
export { s as setNonce } from './index-CoCbyscT.js';

/*
 Stencil Client Patch Browser v4.38.3 | MIT Licensed | https://stenciljs.com
 */

var patchBrowser = () => {
  if (BUILD.isDev && !BUILD.isTesting) {
    consoleDevInfo("Running in development mode.");
  }
  if (BUILD.cloneNodeFix) {
    patchCloneNodeFix(H.prototype);
  }
  const scriptElm = BUILD.scriptDataOpts ? win.document && Array.from(win.document.querySelectorAll("script")).find(
    (s) => new RegExp(`/${NAMESPACE}(\\.esm)?\\.js($|\\?|#)`).test(s.src) || s.getAttribute("data-stencil-namespace") === NAMESPACE
  ) : null;
  const importMeta = import.meta.url;
  const opts = BUILD.scriptDataOpts ? (scriptElm || {})["data-opts"] || {} : {};
  if (importMeta !== "") {
    opts.resourcesUrl = new URL(".", importMeta).href;
  }
  return promiseResolve(opts);
};
var patchCloneNodeFix = (HTMLElementPrototype) => {
  const nativeCloneNodeFn = HTMLElementPrototype.cloneNode;
  HTMLElementPrototype.cloneNode = function(deep) {
    if (this.nodeName === "TEMPLATE") {
      return nativeCloneNodeFn.call(this, deep);
    }
    const clonedNode = nativeCloneNodeFn.call(this, false);
    const srcChildNodes = this.childNodes;
    if (deep) {
      for (let i = 0; i < srcChildNodes.length; i++) {
        if (srcChildNodes[i].nodeType !== 2) {
          clonedNode.appendChild(srcChildNodes[i].cloneNode(true));
        }
      }
    }
    return clonedNode;
  };
};

patchBrowser().then(async (options) => {
  await globalScripts();
  return bootstrapLazy([["blog-app",[[256,"blog-app",{"api":[32],"canUndo":[32],"canRedo":[32],"canvasMetadata":[32],"isPanelOpen":[32],"editingSection":[32],"isConfirmModalOpen":[32],"confirmModalData":[32],"categoryStates":[32],"isPreviewMode":[32],"currentGridState":[32],"isSidebarCollapsed":[32],"previewMetadata":[32],"initialState":[32]},null,{"api":["handleApiChange"]}]]],["config-panel",[[256,"config-panel",{"api":[16],"componentRegistry":[16],"isOpen":[32],"selectedItemId":[32],"selectedCanvasId":[32],"componentName":[32],"componentConfig":[32]},[[4,"item-click","handleItemClick"]],{"api":["handleApiChange"]}]]],["custom-drag-clone",[[256,"custom-drag-clone",{"componentType":[1,"component-type"],"name":[1],"icon":[1],"width":[2],"height":[2]}]]],["custom-config-panel",[[256,"custom-config-panel",{"api":[16],"isOpen":[32],"selectedItemId":[32],"selectedCanvasId":[32],"componentConfig":[32],"componentName":[32]},null,{"api":["handleApiChange"]}]]],["grid-builder",[[256,"grid-builder",{"components":[16],"config":[16],"theme":[16],"plugins":[16],"uiOverrides":[16],"initialState":[16],"canvasMetadata":[16],"onBeforeDelete":[16],"apiRef":[16],"componentRegistry":[32],"initializedPlugins":[32],"announcement":[32],"exportState":[64],"importState":[64],"getState":[64],"addCanvas":[64],"removeCanvas":[64],"setActiveCanvas":[64],"getActiveCanvas":[64],"undo":[64],"redo":[64],"canUndo":[64],"canRedo":[64],"addComponent":[64],"deleteComponent":[64],"updateConfig":[64]},[[0,"grid-item:delete","handleGridItemDelete"],[4,"palette-item-click","handlePaletteItemClick"]],{"components":["handleComponentsChange"],"theme":["handleThemeChange"]}]]],["grid-viewer",[[256,"grid-viewer",{"components":[16],"config":[16],"theme":[16],"initialState":[16],"canvasMetadata":[16],"componentRegistry":[32]},null,{"components":["handleComponentsChange"],"initialState":["handleInitialStateChange"]}]]],["layer-panel",[[256,"layer-panel",{"api":[8],"canvasMetadata":[16],"folderHeight":[2,"folder-height"],"itemHeight":[2,"item-height"],"virtualWindowSize":[2,"virtual-window-size"],"virtualBufferPx":[2,"virtual-buffer-px"],"searchDebounceMs":[2,"search-debounce-ms"],"allItems":[32],"filteredItems":[32],"searchQuery":[32],"folderExpandedState":[32],"virtualScrollOffset":[32]},[[0,"layerItemSelect","handleLayerItemSelect"],[0,"toggleFolder","handleToggleFolder"],[0,"activateCanvas","handleActivateCanvas"],[0,"scrollToCanvas","handleScrollToCanvas"],[0,"layerItemDragStart","handleLayerItemDragStart"],[0,"layer-item-dropped","handleLayerItemDropped"]],{"api":["handleApiChange"]}]]],["canvas-header",[[256,"canvas-header",{"canvasId":[1,"canvas-id"],"sectionTitle":[1,"section-title"],"isDeletable":[4,"is-deletable"],"isActive":[4,"is-active"]}]]],["component-palette",[[256,"component-palette",{"components":[16],"config":[16],"showHeader":[4,"show-header"],"paletteLabel":[1,"palette-label"],"targetGridBuilderId":[1,"target-grid-builder-id"],"draggingItemType":[32],"paletteId":[32]},null,{"components":["handleComponentsChange"],"config":["handleConfigChange"]}]]],["confirmation-modal",[[256,"confirmation-modal",{"isOpen":[4,"is-open"],"data":[16]}]]],["section-editor-panel",[[256,"section-editor-panel",{"isOpen":[4,"is-open"],"sectionData":[16],"editedTitle":[32],"editedColor":[32]},null,{"sectionData":["handleSectionDataChange"]}]]],["canvas-section",[[256,"canvas-section",{"canvasId":[1,"canvas-id"],"config":[16],"componentRegistry":[16],"backgroundColor":[1,"background-color"],"canvasTitle":[1,"canvas-title"],"isActive":[4,"is-active"],"onBeforeDelete":[16],"virtualRendererInstance":[16],"undoRedoManagerInstance":[16],"eventManagerInstance":[16],"stateInstance":[8,"state-instance"],"onStateChange":[16],"domCacheInstance":[16],"theme":[8],"canvas":[32],"renderVersion":[32],"calculatedHeight":[32],"isDropTarget":[32]},null,{"canvasId":["handleCanvasIdChange"],"config":["handleConfigChange"],"isActive":["handleIsActiveChange"]}]]],["canvas-section-viewer",[[256,"canvas-section-viewer",{"canvasId":[1,"canvas-id"],"items":[16],"currentViewport":[1,"current-viewport"],"config":[16],"componentRegistry":[16],"backgroundColor":[1,"background-color"],"virtualRendererInstance":[16],"stateInstance":[8,"state-instance"],"renderVersion":[32],"calculatedHeight":[32]},null,{"items":["handleItemsChange"],"currentViewport":["handleViewportChange"]}]]],["blog-article",[[256,"blog-article",{"content":[1],"author":[1],"date":[1],"backgroundColor":[1,"background-color"]}]]],["blog-article-drag-clone",[[256,"blog-article-drag-clone"]]],["blog-button",[[256,"blog-button",{"label":[1],"variant":[1],"href":[1],"backgroundColor":[1,"background-color"]}]]],["blog-button-drag-clone",[[256,"blog-button-drag-clone"]]],["blog-header",[[256,"blog-header",{"headerTitle":[1,"header-title"],"subtitle":[1],"backgroundColor":[1,"background-color"]}]]],["blog-header-drag-clone",[[256,"blog-header-drag-clone"]]],["blog-image",[[256,"blog-image",{"src":[1],"alt":[1],"caption":[1],"objectFit":[1,"object-fit"],"backgroundColor":[1,"background-color"],"imageLoaded":[32],"imageError":[32]}]]],["blog-image-drag-clone",[[256,"blog-image-drag-clone"]]],["custom-palette-item",[[256,"custom-palette-item",{"componentType":[1,"component-type"],"name":[1],"icon":[1]}]]],["dashboard-widget",[[256,"dashboard-widget",{"backgroundColor":[1,"background-color"]}]]],["dashboard-widget-drag-clone",[[256,"dashboard-widget-drag-clone"]]],["image-gallery",[[256,"image-gallery",{"imageCount":[2,"image-count"],"backgroundColor":[1,"background-color"]}]]],["image-gallery-drag-clone",[[256,"image-gallery-drag-clone"]]],["layer-panel-folder-header",[[256,"layer-panel-folder-header",{"canvasId":[1,"canvas-id"],"canvasTitle":[1,"canvas-title"],"itemCount":[2,"item-count"],"isExpanded":[4,"is-expanded"],"isActive":[4,"is-active"],"isEmpty":[4,"is-empty"],"totalItemCount":[2,"total-item-count"]}]]],["layer-panel-item",[[256,"layer-panel-item",{"itemId":[1,"item-id"],"canvasId":[1,"canvas-id"],"name":[1],"type":[1],"zIndex":[2,"z-index"],"isActive":[4,"is-active"]}]]],["live-data",[[256,"live-data",{"backgroundColor":[1,"background-color"],"temperature":[32],"cpu":[32],"memory":[32],"updateCount":[32],"lastUpdate":[32]}]]],["live-data-drag-clone",[[256,"live-data-drag-clone"]]],["grid-item-wrapper",[[256,"grid-item-wrapper",{"item":[16],"renderVersion":[2,"render-version"],"config":[16],"componentRegistry":[16],"onBeforeDelete":[16],"theme":[8],"viewerMode":[4,"viewer-mode"],"currentViewport":[1,"current-viewport"],"virtualRendererInstance":[16],"eventManagerInstance":[16],"stateInstance":[8,"state-instance"],"undoRedoManagerInstance":[16],"domCacheInstance":[16],"canvasItems":[16],"isSelected":[32],"isVisible":[32]},[[0,"item-delete","handleItemDeleteEvent"],[0,"item-bring-to-front","handleItemBringToFrontEvent"],[0,"item-send-to-back","handleItemSendToBackEvent"]],{"item":["handleItemChange"],"renderVersion":["handleRenderVersionChange"],"config":["handleConfigChange"],"currentViewport":["handleViewportChange"]}]]]], options);
});
//# sourceMappingURL=grid-builder.esm.js.map
