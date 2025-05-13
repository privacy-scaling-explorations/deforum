import { Prisma } from '@prisma/client';

// Extend the CommunityMember type to include role
declare global {
  namespace PrismaJson {
    type BadgeRequirements = {
      domain?: string;
      exactEmail?: string;
    };
  }
}

// Type for badge requirements
export type BadgeRequirements = {
  domain?: string;
  exactEmail?: string;
};

export enum CommunityMemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

// Extend Prisma types
declare global {
  namespace PrismaClient {
    interface CommunityMember {
      role: CommunityMemberRole;
    }
  }
}

// Extend Prisma input types
declare global {
  namespace Prisma {
    interface CommunityMemberCreateInput {
      role?: CommunityMemberRole;
    }

    interface CommunityMemberWhereInput {
      role?: CommunityMemberRole;
    }
  }
}
