import type { SupabaseClient } from '@supabase/supabase-js'
import type { AttachmentRepository } from '../domain/attachment'
import { validateAttachment } from '../domain/ticketValidation'
import { friendlyError } from '../lib/errors'
import type { Database } from '../lib/database.types'

const BUCKET = 'it-ticket-attachments'

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  pdf: 'application/pdf', txt: 'text/plain', log: 'text/plain',
}

export function createSupabaseAttachmentRepository(client: SupabaseClient<Database>): AttachmentRepository {
  async function userFolder(ticketId: string): Promise<string> {
    const { data, error } = await client.auth.getUser()
    if (error || !data.user) throw friendlyError(error, 'Vui lòng đăng nhập lại để quản lý tệp.')
    return `${data.user.id}/${ticketId}`
  }

  return {
    async list(ticketId) {
      const folder = await userFolder(ticketId)
      const objects = []
      let offset = 0
      while (true) {
        const { data, error } = await client.storage.from(BUCKET).list(folder, {
          limit: 100,
          offset,
          sortBy: { column: 'created_at', order: 'desc' },
        })
        if (error) throw friendlyError(error, 'Không thể tải danh sách tệp đính kèm.')
        const page = data ?? []
        objects.push(...page)
        if (page.length < 100) break
        offset += page.length
      }
      return objects.map((item) => {
        const metadata = item.metadata && typeof item.metadata === 'object'
          ? item.metadata as Record<string, unknown>
          : {}
        const originalName = item.name.split('--').slice(1).join('--') || item.name
        return {
          id: item.id ?? item.name,
          name: originalName,
          path: `${folder}/${item.name}`,
          size: Number(metadata.size ?? 0),
          contentType: typeof metadata.mimetype === 'string' ? metadata.mimetype : 'application/octet-stream',
          createdAt: item.created_at ?? item.updated_at ?? '',
        }
      })
    },

    async upload(ticketId, file) {
      const validationError = validateAttachment(file)
      if (validationError) throw new Error(validationError)
      const folder = await userFolder(ticketId)
      const extension = file.name.split('.').at(-1)?.toLocaleLowerCase('en-US') ?? ''
      const safeName = file.name.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '_').slice(0, 120)
      const objectName = `${crypto.randomUUID()}--${safeName}`
      const path = `${folder}/${objectName}`
      const { error } = await client.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || MIME_BY_EXTENSION[extension],
      })
      if (error) throw friendlyError(error, 'Không thể tải tệp lên. Vui lòng thử lại.')
      return {
        id: objectName,
        name: file.name,
        path,
        size: file.size,
        contentType: file.type || MIME_BY_EXTENSION[extension],
        createdAt: new Date().toISOString(),
      }
    },

    async signedUrl(attachment, download = false) {
      const ticketId = attachment.path.split('/')[1] ?? ''
      const folder = await userFolder(ticketId)
      if (!attachment.path.startsWith(`${folder}/`) || attachment.path.split('/').length !== 3) {
        throw new Error('Tệp đính kèm không thuộc tài khoản hiện tại.')
      }
      const { data, error } = await client.storage.from(BUCKET).createSignedUrl(attachment.path, 60, download ? { download: attachment.name } : undefined)
      if (error || !data) throw friendlyError(error, 'Không thể mở tệp đính kèm.')
      return data.signedUrl
    },

    async delete(attachment) {
      const ticketId = attachment.path.split('/')[1] ?? ''
      const folder = await userFolder(ticketId)
      if (!attachment.path.startsWith(`${folder}/`) || attachment.path.split('/').length !== 3) {
        throw new Error('Tệp đính kèm không thuộc tài khoản hiện tại.')
      }
      const { error } = await client.storage.from(BUCKET).remove([attachment.path])
      if (error) throw friendlyError(error, 'Không thể xóa tệp đính kèm.')
    },
  }
}
