import { IUsrData } from '@/types/i-usr-data';

export interface IAuthService {
  isAuthenticated(): Promise<boolean>;
  login(): Promise<void>;
  logout(): Promise<void>;
  getUser(): Promise<IUsrData>;
}  