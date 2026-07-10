import { type Models } from 'appwrite';

export type ContractsCreate = {
    "name": string;
    "clientName": string;
    "value"?: number;
    "status": string;
    "teamId": string;
    "createdAt"?: string;
}

export type Contracts = Models.Row & {
    "name": string;
    "clientName": string;
    "value"?: number;
    "status": string;
    "teamId": string;
    "createdAt"?: string;
}

export type ContactsCreate = {
    "name": string;
    "email": string;
    "company"?: string;
    "teamId": string;
    "createdAt"?: string;
}

export type Contacts = Models.Row & {
    "name": string;
    "email": string;
    "company"?: string;
    "teamId": string;
    "createdAt"?: string;
}

export type TasksCreate = {
    "title": string;
    "status": string;
    "dueDate"?: string;
    "assignedTo"?: string;
    "teamId": string;
    "createdAt"?: string;
}

export type Tasks = Models.Row & {
    "title": string;
    "status": string;
    "dueDate"?: string;
    "assignedTo"?: string;
    "teamId": string;
    "createdAt"?: string;
}

export type NotificationsCreate = {
    "title": string;
    "message": string;
    "read": boolean;
    "teamId": string;
    "createdAt"?: string;
}

export type Notifications = Models.Row & {
    "title": string;
    "message": string;
    "read": boolean;
    "teamId": string;
    "createdAt"?: string;
}

declare const __roleStringBrand: unique symbol;
export type RoleString = string & { readonly [__roleStringBrand]: never };

export type RoleBuilder = {
  any: () => RoleString;
  user: (userId: string, status?: string) => RoleString;
  users: (status?: string) => RoleString;
  guests: () => RoleString;
  team: (teamId: string, role?: string) => RoleString;
  member: (memberId: string) => RoleString;
  label: (label: string) => RoleString;
}

export type PermissionBuilder = {
  read: (role: RoleString) => string;
  write: (role: RoleString) => string;
  create: (role: RoleString) => string;
  update: (role: RoleString) => string;
  delete: (role: RoleString) => string;
}

export type PermissionCallback = (permission: PermissionBuilder, role: RoleBuilder) => string[];

export type QueryValue = string | number | boolean;

export type ExtractQueryValue<T> = T extends (infer U)[]
  ? U extends QueryValue ? U : never
  : T extends QueryValue | null ? NonNullable<T> : never;

export type QueryableKeys<T> = {
  [K in keyof T]: ExtractQueryValue<T[K]> extends never ? never : K;
}[keyof T];

export type QueryableFieldValue<T, K> = K extends keyof T
  ? ExtractQueryValue<T[K]>
  : never;

export type QueryBuilder<T> = {
  equal: <K extends QueryableKeys<T>>(field: K, value: QueryableFieldValue<T, K>) => string;
  notEqual: <K extends QueryableKeys<T>>(field: K, value: QueryableFieldValue<T, K>) => string;
  lessThan: <K extends QueryableKeys<T>>(field: K, value: QueryableFieldValue<T, K>) => string;
  lessThanEqual: <K extends QueryableKeys<T>>(field: K, value: QueryableFieldValue<T, K>) => string;
  greaterThan: <K extends QueryableKeys<T>>(field: K, value: QueryableFieldValue<T, K>) => string;
  greaterThanEqual: <K extends QueryableKeys<T>>(field: K, value: QueryableFieldValue<T, K>) => string;
  contains: <K extends QueryableKeys<T>>(field: K, value: QueryableFieldValue<T, K>) => string;
  search: <K extends QueryableKeys<T>>(field: K, value: string) => string;
  isNull: <K extends QueryableKeys<T>>(field: K) => string;
  isNotNull: <K extends QueryableKeys<T>>(field: K) => string;
  startsWith: <K extends QueryableKeys<T>>(field: K, value: string) => string;
  endsWith: <K extends QueryableKeys<T>>(field: K, value: string) => string;
  between: <K extends QueryableKeys<T>>(field: K, start: QueryableFieldValue<T, K>, end: QueryableFieldValue<T, K>) => string;
  select: <K extends keyof T>(fields: K[]) => string;
  orderAsc: <K extends keyof T>(field: K) => string;
  orderDesc: <K extends keyof T>(field: K) => string;
  limit: (value: number) => string;
  offset: (value: number) => string;
  cursorAfter: (documentId: string) => string;
  cursorBefore: (documentId: string) => string;
  or: (...queries: string[]) => string;
  and: (...queries: string[]) => string;
}

export type DatabaseId = "leadwave-main";

export type DatabaseTableMap = {
  "leadwave-main": {
    "Contracts": {
      create: (data: {
        "name": string;
        "clientName": string;
        "value"?: number;
        "status": string;
        "teamId": string;
        "createdAt"?: string;
      }, options?: { rowId?: string; permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Contracts>;
      get: (id: string) => Promise<Contracts>;
      update: (id: string, data: Partial<{
        "name": string;
        "clientName": string;
        "value"?: number;
        "status": string;
        "teamId": string;
        "createdAt"?: string;
      }>, options?: { permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Contracts>;
      delete: (id: string, options?: { transactionId?: string }) => Promise<void>;
      list: (options?: { queries?: (q: { equal: <K extends QueryableKeys<Contracts>>(field: K, value: QueryableFieldValue<Contracts, K>) => string; notEqual: <K extends QueryableKeys<Contracts>>(field: K, value: QueryableFieldValue<Contracts, K>) => string; lessThan: <K extends QueryableKeys<Contracts>>(field: K, value: QueryableFieldValue<Contracts, K>) => string; lessThanEqual: <K extends QueryableKeys<Contracts>>(field: K, value: QueryableFieldValue<Contracts, K>) => string; greaterThan: <K extends QueryableKeys<Contracts>>(field: K, value: QueryableFieldValue<Contracts, K>) => string; greaterThanEqual: <K extends QueryableKeys<Contracts>>(field: K, value: QueryableFieldValue<Contracts, K>) => string; contains: <K extends QueryableKeys<Contracts>>(field: K, value: QueryableFieldValue<Contracts, K>) => string; search: <K extends QueryableKeys<Contracts>>(field: K, value: string) => string; isNull: <K extends QueryableKeys<Contracts>>(field: K) => string; isNotNull: <K extends QueryableKeys<Contracts>>(field: K) => string; startsWith: <K extends QueryableKeys<Contracts>>(field: K, value: string) => string; endsWith: <K extends QueryableKeys<Contracts>>(field: K, value: string) => string; between: <K extends QueryableKeys<Contracts>>(field: K, start: QueryableFieldValue<Contracts, K>, end: QueryableFieldValue<Contracts, K>) => string; select: <K extends keyof Contracts>(fields: K[]) => string; orderAsc: <K extends keyof Contracts>(field: K) => string; orderDesc: <K extends keyof Contracts>(field: K) => string; limit: (value: number) => string; offset: (value: number) => string; cursorAfter: (documentId: string) => string; cursorBefore: (documentId: string) => string; or: (...queries: string[]) => string; and: (...queries: string[]) => string }) => string[] }) => Promise<{ total: number; rows: Contracts[] }>;
    };
    "Contacts": {
      create: (data: {
        "name": string;
        "email": string;
        "company"?: string;
        "teamId": string;
        "createdAt"?: string;
      }, options?: { rowId?: string; permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Contacts>;
      get: (id: string) => Promise<Contacts>;
      update: (id: string, data: Partial<{
        "name": string;
        "email": string;
        "company"?: string;
        "teamId": string;
        "createdAt"?: string;
      }>, options?: { permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Contacts>;
      delete: (id: string, options?: { transactionId?: string }) => Promise<void>;
      list: (options?: { queries?: (q: { equal: <K extends QueryableKeys<Contacts>>(field: K, value: QueryableFieldValue<Contacts, K>) => string; notEqual: <K extends QueryableKeys<Contacts>>(field: K, value: QueryableFieldValue<Contacts, K>) => string; lessThan: <K extends QueryableKeys<Contacts>>(field: K, value: QueryableFieldValue<Contacts, K>) => string; lessThanEqual: <K extends QueryableKeys<Contacts>>(field: K, value: QueryableFieldValue<Contacts, K>) => string; greaterThan: <K extends QueryableKeys<Contacts>>(field: K, value: QueryableFieldValue<Contacts, K>) => string; greaterThanEqual: <K extends QueryableKeys<Contacts>>(field: K, value: QueryableFieldValue<Contacts, K>) => string; contains: <K extends QueryableKeys<Contacts>>(field: K, value: QueryableFieldValue<Contacts, K>) => string; search: <K extends QueryableKeys<Contacts>>(field: K, value: string) => string; isNull: <K extends QueryableKeys<Contacts>>(field: K) => string; isNotNull: <K extends QueryableKeys<Contacts>>(field: K) => string; startsWith: <K extends QueryableKeys<Contacts>>(field: K, value: string) => string; endsWith: <K extends QueryableKeys<Contacts>>(field: K, value: string) => string; between: <K extends QueryableKeys<Contacts>>(field: K, start: QueryableFieldValue<Contacts, K>, end: QueryableFieldValue<Contacts, K>) => string; select: <K extends keyof Contacts>(fields: K[]) => string; orderAsc: <K extends keyof Contacts>(field: K) => string; orderDesc: <K extends keyof Contacts>(field: K) => string; limit: (value: number) => string; offset: (value: number) => string; cursorAfter: (documentId: string) => string; cursorBefore: (documentId: string) => string; or: (...queries: string[]) => string; and: (...queries: string[]) => string }) => string[] }) => Promise<{ total: number; rows: Contacts[] }>;
    };
    "Tasks": {
      create: (data: {
        "title": string;
        "status": string;
        "dueDate"?: string;
        "assignedTo"?: string;
        "teamId": string;
        "createdAt"?: string;
      }, options?: { rowId?: string; permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Tasks>;
      get: (id: string) => Promise<Tasks>;
      update: (id: string, data: Partial<{
        "title": string;
        "status": string;
        "dueDate"?: string;
        "assignedTo"?: string;
        "teamId": string;
        "createdAt"?: string;
      }>, options?: { permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Tasks>;
      delete: (id: string, options?: { transactionId?: string }) => Promise<void>;
      list: (options?: { queries?: (q: { equal: <K extends QueryableKeys<Tasks>>(field: K, value: QueryableFieldValue<Tasks, K>) => string; notEqual: <K extends QueryableKeys<Tasks>>(field: K, value: QueryableFieldValue<Tasks, K>) => string; lessThan: <K extends QueryableKeys<Tasks>>(field: K, value: QueryableFieldValue<Tasks, K>) => string; lessThanEqual: <K extends QueryableKeys<Tasks>>(field: K, value: QueryableFieldValue<Tasks, K>) => string; greaterThan: <K extends QueryableKeys<Tasks>>(field: K, value: QueryableFieldValue<Tasks, K>) => string; greaterThanEqual: <K extends QueryableKeys<Tasks>>(field: K, value: QueryableFieldValue<Tasks, K>) => string; contains: <K extends QueryableKeys<Tasks>>(field: K, value: QueryableFieldValue<Tasks, K>) => string; search: <K extends QueryableKeys<Tasks>>(field: K, value: string) => string; isNull: <K extends QueryableKeys<Tasks>>(field: K) => string; isNotNull: <K extends QueryableKeys<Tasks>>(field: K) => string; startsWith: <K extends QueryableKeys<Tasks>>(field: K, value: string) => string; endsWith: <K extends QueryableKeys<Tasks>>(field: K, value: string) => string; between: <K extends QueryableKeys<Tasks>>(field: K, start: QueryableFieldValue<Tasks, K>, end: QueryableFieldValue<Tasks, K>) => string; select: <K extends keyof Tasks>(fields: K[]) => string; orderAsc: <K extends keyof Tasks>(field: K) => string; orderDesc: <K extends keyof Tasks>(field: K) => string; limit: (value: number) => string; offset: (value: number) => string; cursorAfter: (documentId: string) => string; cursorBefore: (documentId: string) => string; or: (...queries: string[]) => string; and: (...queries: string[]) => string }) => string[] }) => Promise<{ total: number; rows: Tasks[] }>;
    };
    "Notifications": {
      create: (data: {
        "title": string;
        "message": string;
        "read": boolean;
        "teamId": string;
        "createdAt"?: string;
      }, options?: { rowId?: string; permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Notifications>;
      get: (id: string) => Promise<Notifications>;
      update: (id: string, data: Partial<{
        "title": string;
        "message": string;
        "read": boolean;
        "teamId": string;
        "createdAt"?: string;
      }>, options?: { permissions?: (permission: { read: (role: RoleString) => string; write: (role: RoleString) => string; create: (role: RoleString) => string; update: (role: RoleString) => string; delete: (role: RoleString) => string }, role: { any: () => RoleString; user: (userId: string, status?: string) => RoleString; users: (status?: string) => RoleString; guests: () => RoleString; team: (teamId: string, role?: string) => RoleString; member: (memberId: string) => RoleString; label: (label: string) => RoleString }) => string[]; transactionId?: string }) => Promise<Notifications>;
      delete: (id: string, options?: { transactionId?: string }) => Promise<void>;
      list: (options?: { queries?: (q: { equal: <K extends QueryableKeys<Notifications>>(field: K, value: QueryableFieldValue<Notifications, K>) => string; notEqual: <K extends QueryableKeys<Notifications>>(field: K, value: QueryableFieldValue<Notifications, K>) => string; lessThan: <K extends QueryableKeys<Notifications>>(field: K, value: QueryableFieldValue<Notifications, K>) => string; lessThanEqual: <K extends QueryableKeys<Notifications>>(field: K, value: QueryableFieldValue<Notifications, K>) => string; greaterThan: <K extends QueryableKeys<Notifications>>(field: K, value: QueryableFieldValue<Notifications, K>) => string; greaterThanEqual: <K extends QueryableKeys<Notifications>>(field: K, value: QueryableFieldValue<Notifications, K>) => string; contains: <K extends QueryableKeys<Notifications>>(field: K, value: QueryableFieldValue<Notifications, K>) => string; search: <K extends QueryableKeys<Notifications>>(field: K, value: string) => string; isNull: <K extends QueryableKeys<Notifications>>(field: K) => string; isNotNull: <K extends QueryableKeys<Notifications>>(field: K) => string; startsWith: <K extends QueryableKeys<Notifications>>(field: K, value: string) => string; endsWith: <K extends QueryableKeys<Notifications>>(field: K, value: string) => string; between: <K extends QueryableKeys<Notifications>>(field: K, start: QueryableFieldValue<Notifications, K>, end: QueryableFieldValue<Notifications, K>) => string; select: <K extends keyof Notifications>(fields: K[]) => string; orderAsc: <K extends keyof Notifications>(field: K) => string; orderDesc: <K extends keyof Notifications>(field: K) => string; limit: (value: number) => string; offset: (value: number) => string; cursorAfter: (documentId: string) => string; cursorBefore: (documentId: string) => string; or: (...queries: string[]) => string; and: (...queries: string[]) => string }) => string[] }) => Promise<{ total: number; rows: Notifications[] }>;
    }
  }
};

export type DatabaseHandle<D extends DatabaseId> = {
  use: <T extends keyof DatabaseTableMap[D] & string>(tableId: T) => DatabaseTableMap[D][T];

};

export type DatabaseTables = {
  use: <D extends DatabaseId>(databaseId: D) => DatabaseHandle<D>;

};
