export type FieldError = { field?: string; message: string; code?: string };

export type Role = "owner" | "editor" | "viewer";
export type ShareRole = "viewer" | "editor";

export type SessionUser = { id: string; email: string; name: string };
export type DocumentOwner = { id: string; name: string; email: string };

export type DocumentSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type SharedDocumentSummary = DocumentSummary & {
  role: ShareRole;
  owner: DocumentOwner;
};

export type DocumentDetail = {
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner: DocumentOwner;
  role: Role;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DocumentsList = {
  owned: DocumentSummary[];
  shared: SharedDocumentSummary[];
};

export type ShareRecipient = {
  userId: string;
  name: string;
  email: string;
  role: ShareRole;
  createdAt: string;
};
