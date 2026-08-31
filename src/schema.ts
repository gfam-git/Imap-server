import { z } from 'zod';

// Shared request schemas
export const FolderParamSchema = z.object({
  folder: z.string().optional().describe('IMAP folder name, default "INBOX"'),
});

export const UidParamSchema = z.object({
  uid: z.number().int().positive().describe('Message UID'),
});

export const UidFolderParamSchema = z.object({
  uid: z.number().int().positive().describe('Message UID'),
  folder: z.string().optional().describe('Source IMAP folder'),
});

// Shared response schemas
export const ReadFlagResponseSchema = z.object({
  uid: z.number().int().positive(),
  read: z.boolean(),
});
export type ReadFlagResponse = z.infer<typeof ReadFlagResponseSchema>;

export const MoveEmailResponseSchema = z.object({
  uid: z.number().int().positive(),
  from: z.string(),
  to: z.string(),
});
export type MoveEmailResponse = z.infer<typeof MoveEmailResponseSchema>;

export const DeleteEmailResponseSchema = z.object({
  uid: z.number().int().positive(),
  status: z.string(),
});
export type DeleteEmailResponse = z.infer<typeof DeleteEmailResponseSchema>;

export const CreateFolderResponseSchema = z.object({
  name: z.string(),
  created: z.boolean(),
});
export type CreateFolderResponse = z.infer<typeof CreateFolderResponseSchema>;

export const ListUnreadResponseSchema = z.object({
  total_unread: z.number().int().nonnegative(),
  messages: z.array(
    z.object({
      uid: z.number().int().positive(),
      subject: z.string(),
      from: z.string(),
      date: z.string(),
    })
  ),
});
export type ListUnreadResponse = z.infer<typeof ListUnreadResponseSchema>;

// Phase 1 specific schemas

export const FolderInfoSchema = z.object({
  name: z.string(),
  delimiter: z.string(),
  flags: z.array(z.string()),
});

export const ListFoldersResponseSchema = z.object({
  folders: z.array(FolderInfoSchema),
});
export type ListFoldersResponse = z.infer<typeof ListFoldersResponseSchema>;

export const SearchResultSchema = z.object({
  uid: z.number().int().positive(),
  subject: z.string(),
  from: z.string(),
  date: z.string(),
  message_id: z.string(),
  snippet: z.string(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const SearchEmailsResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  results: z.array(SearchResultSchema),
});
export type SearchEmailsResponse = z.infer<typeof SearchEmailsResponseSchema>;

export const AddressSchema = z.object({
  address: z.string(),
  name: z.string(),
});
export type Address = z.infer<typeof AddressSchema>;

export const EmailAttachmentSchema = z.object({
  name: z.string(),
  size: z.number().int().nonnegative(),
  content_type: z.string(),
  content_base64: z.string().optional(),
});
export type EmailAttachment = z.infer<typeof EmailAttachmentSchema>;

export const FetchEmailResponseSchema = z.object({
  uid: z.number().int().positive(),
  subject: z.string(),
  from: AddressSchema,
  to: z.array(AddressSchema),
  cc: z.array(AddressSchema).optional(),
  date: z.string(),
  message_id: z.string(),
  body_text: z.string().optional(),
  body_html: z.string().optional(),
  attachments: z.array(EmailAttachmentSchema).optional(),
});
export type FetchEmailResponse = z.infer<typeof FetchEmailResponseSchema>;

export const EmailBodyResponseSchema = z.object({
  body_text: z.string().optional(),
  body_html: z.string().optional(),
});
export type EmailBodyResponse = z.infer<typeof EmailBodyResponseSchema>;

export const EmailHeadersResponseSchema = z.object({
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  cc: z.string().optional(),
  date: z.string(),
  message_id: z.string(),
  in_reply_to: z.string().optional(),
  headers: z.record(z.string(), z.string()),
});
export type EmailHeadersResponse = z.infer<typeof EmailHeadersResponseSchema>;

export const EmailWaitingResponseSchema = z.object({
  found: z.boolean(),
  message: z.string().optional(),
  uid: z.number().int().positive().optional(),
  subject: z.string().optional(),
  from: z.string().optional(),
  date: z.string().optional(),
  body_text: z.string().optional(),
});
export type EmailWaitingResponse = z.infer<typeof EmailWaitingResponseSchema>;
