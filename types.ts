// types.ts

export interface User {
    id: string;
    email: string;
    username: string;
    role: 'executive' | 'staff' | 'resident' | 'security';
    address?: string;
    phone_number?: string;
    created_at: string;
    has_pin_set: boolean;
    executive_pin?: string;
  }
  
  export interface AuthResponse {
    user: User | null;
    session: any | null;
  }
  
  export type OAuthProvider = 'google' | 'facebook' | 'github';

  export type IconName = 
  | "link" 
  | "map" 
  | "filter" 
  | "at" 
  | "push" 
  | "search" 
  | "repeat" 
  | "body" 
  | "code" 
  | "menu" 
  | "time" 
  | "ellipse" 
  | "image" 
  | "stop" 
  | "text" 
  | "key" 
  | "mail-outline" 
  | "lock-closed-outline" 
  | "person-outline"
  | "call-outline"
  | "home-outline"
  // ... add all the other valid icon names here
  | undefined;

  export interface Invite {
    createdAt: string;
    [key: string]: any;
  }
  export interface GlobalContextType {
    isLoggedIn: boolean;
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    isLoading: boolean;
    invites: Invite[];
    setInvites: React.Dispatch<React.SetStateAction<Invite[]>>;
    fetchAndSetInvites: () => Promise<void>;
    filteredInvites: Invite[];
    setFilteredInvites: React.Dispatch<React.SetStateAction<Invite[]>>;
    triggerUpdate: () => void;
    signOut: () => Promise<void>;
    updateUserProfile: (updatedProfile: Partial<User>) => void;
  }