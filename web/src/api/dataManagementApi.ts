import { apiDelete, apiGet, apiPostJson } from './client'

export const loadDataUploads = async () => {
  const payload = await apiGet('/data-management/files')
  return payload.items
}

export const uploadDataFile = async (upload) => {
  const payload = await apiPostJson('/data-management/files', upload)
  return payload.item
}

export const deleteDataFile = async (id) => {
  const payload = await apiDelete(`/data-management/files/${id}`)
  return payload.item
}
