export interface UserType {
  id: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
  deleted?: Date | null;
  dataRetentionDate?: Date | null;
}
