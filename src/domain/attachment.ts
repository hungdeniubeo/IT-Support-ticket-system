export interface TicketAttachment {
  id: string
  name: string
  path: string
  size: number
  contentType: string
  createdAt: string
}

export interface AttachmentRepository {
  list(ticketId: string): Promise<TicketAttachment[]>
  upload(ticketId: string, file: File): Promise<TicketAttachment>
  signedUrl(attachment: TicketAttachment, download?: boolean): Promise<string>
  delete(attachment: TicketAttachment): Promise<void>
}
