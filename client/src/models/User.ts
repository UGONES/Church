// models/User.ts

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
}

export interface CommunicationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  newsletter: boolean;
  eventReminders: boolean;
  prayerUpdates: boolean;
}

export interface VolunteerStats {
  totalHours: number;
  completedTrainings: string[];
  activeApplications: number;
}

export interface UserData {
  _id?: string | null;
  id?: string | null;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: 'user' | 'admin' | 'moderator' | string;
  isLoggedIn?: boolean;
  emailVerified?: boolean;
  profileImage?: string | null;
  avatar?: string | null;
  familyMembers?: FamilyMember[];
  communicationPreferences?: CommunicationPreferences;
  memberSince?: Date;
  membershipStatus?: string;
  smallGroup?: string;
  volunteerStats?: VolunteerStats;
  createdAt?: Date;
  [key: string]: any;
}

export class User {
  _id: string | null;
  id: string | null;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role?: 'user' | 'admin' | 'moderator' | string;
  isLoggedIn: boolean;
  emailVerified: boolean;
  profileImage: string | null;
  familyMembers: FamilyMember[];
  communicationPreferences: CommunicationPreferences;
  memberSince: Date;
  membershipStatus: string;
  smallGroup: string;
  volunteerStats: VolunteerStats;
  createdAt: Date;
  [key: string]: any;


  constructor(data: UserData = {}) {
    this._id = data._id || null;
    this.id = data.id || data._id || null;
    this.email = data.email || '';
    this.name = data.name || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.role = data.role || 'user' || 'string';
    this.isLoggedIn = data.isLoggedIn || false;
    this.emailVerified = data.emailVerified || false;
    this.profileImage = data.profileImage || data.avatar || null;
    this.familyMembers = data.familyMembers || [];
    this.communicationPreferences = data.communicationPreferences || {
      emailNotifications: true,
      smsNotifications: false,
      newsletter: true,
      eventReminders: true,
      prayerUpdates: true
    };
    this.memberSince = data.memberSince || new Date();
    this.membershipStatus = data.membershipStatus || 'active';
    this.smallGroup = data.smallGroup || '';
    this.volunteerStats = data.volunteerStats || {
      totalHours: 0,
      completedTrainings: [],
      activeApplications: 0
    };
    this.createdAt = data.createdAt || new Date();
    Object.assign(this, data);
  }

  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.name;
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isModerator(): boolean {
    return this.role === 'moderator' || this.role === 'admin';
  }

  get isUser(): boolean {
    return this.role === 'user';
  }

  get isAuthenticated(): boolean {
    return !!this.id && this.isLoggedIn;
  }
}