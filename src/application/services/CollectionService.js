import { Collection } from '../../domain/entities/Collection.js'
import { generateId } from '../../infrastructure/utils/generateId.js'

export class CollectionService {
  constructor({ collectionRepository }) {
    this._repo = collectionRepository
  }

  getCollectionTree() {
    return this._repo.buildTree()
  }

  getCollection(id) {
    const tree = this._repo.buildTree()
    return this._findInTree(tree, id)
  }

  createCollection({ name, description = '', parentId = null, schedulerType = 'sm2' }) {
    const col = new Collection({
      id: generateId(),
      parentId,
      name,
      description,
      schedulerType,
    })
    return this._repo.save(col)
  }

  deleteCollection(id) {
    this._repo.delete(id)
  }

  _findInTree(tree, id) {
    for (const col of tree) {
      if (col.id === id) return col
      const found = this._findInTree(col.children, id)
      if (found) return found
    }
    return null
  }
}
