// pragmatic-drag-and-drop ESM root is an empty stub.
// vite.config.js aliases this package → dist/cjs/adapter/element-adapter.js
// This declaration bridges TS → that same CJS entry for type checking.
declare module '@atlaskit/pragmatic-drag-and-drop' {
  export { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/dist/types/adapter/element-adapter'
  export type {
    ElementEventPayloadMap,
    ElementDropTargetEventPayloadMap,
  } from '@atlaskit/pragmatic-drag-and-drop/dist/types/adapter/element-adapter'
  export type {
    BaseEventPayload,
    ElementDragType,
    ElementDragPayload,
  } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types'
}
