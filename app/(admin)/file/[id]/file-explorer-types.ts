export interface ExplorerTransferTarget {
  id: string
  name: string
  folderId?: string
  parentId?: string
}

export interface ExplorerTransferDataSource {
  id: string
  name: string
  list: ExplorerTransferTarget[]
}
