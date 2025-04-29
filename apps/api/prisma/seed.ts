import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean up existing data
  await prisma.$transaction([
    prisma.postReply.deleteMany(),
    prisma.post.deleteMany(),
    prisma.communityMember.deleteMany(),
    prisma.communityRequiredBadge.deleteMany(),
    prisma.community.deleteMany(),
    prisma.userBadge.deleteMany(),
    prisma.badge.deleteMany(),
    prisma.protocol.deleteMany(),
    prisma.user.deleteMany(),
  ])

  // Create users
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        id: '1e900107-5e56-4d74-91d9-25c191749fcf',
        username: 'Anonymous',
        isAnon: true,
      },
    }),
    prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'kali',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'kali@pse.dev',
        bio: 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
        isAnon: false,
      },
    }),
    prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        username: 'Mario Rossi',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'mario.rossi@pse.dev',
        bio: 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
        isAnon: false,
      },
    }),
    prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        username: 'Mario Bianchi',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'john.doe@example.com',
        website: 'https://example.com',
        bio: 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.',
        isAnon: false,
      },
    }),
    prisma.user.create({
      data: {
        id: 'e5f67f78-9012-5678-3ef0-5678901234ef',
        username: 'AtHeartEngineer',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'atheartengineer@pse.dev',
        bio: '🪐 Stay Curious',
        isAnon: false,
      },
    }),
  ])

  // Create protocols
  const emailProtocol = await prisma.protocol.create({
    data: {
      name: 'Email Verification',
      slug: 'email-verification',
      description: 'Verifies email ownership through magic links',
      isActive: true
    }
  });

  const passportProtocol = await prisma.protocol.create({
    data: {
      name: 'Passport Verification',
      slug: 'passport-verification',
      description: 'Verifies age and country through passport',
      isActive: true
    }
  });

  // Create badges for each protocol
  const emailBadge = await prisma.badge.create({
    data: {
      name: 'Verified Email',
      slug: 'verified-email',
      description: 'Email address has been verified',
      protocolId: emailProtocol.id,
      privateByDefault: false,
      metadata: {
        type: 'email',
        description: 'Verifies ownership of an email address'
      }
    }
  });

  const companyEmailBadge = await prisma.badge.create({
    data: {
      name: 'Company Email',
      slug: 'company-email',
      description: 'Corporate email address has been verified',
      protocolId: emailProtocol.id,
      privateByDefault: true,
      expiresAfter: 365, // Expires after 1 year
      metadata: {
        type: 'email',
        description: 'Verifies ownership of a corporate email address',
        domains: ['company.com']
      }
    }
  });

  const age18Badge = await prisma.badge.create({
    data: {
      name: 'Age 18+',
      slug: 'age-18-plus',
      description: 'User is verified to be 18 or older',
      protocolId: passportProtocol.id,
      privateByDefault: true,
      metadata: {
        type: 'age',
        minAge: 18
      }
    }
  });

  const age21Badge = await prisma.badge.create({
    data: {
      name: 'Age 21+',
      slug: 'age-21-plus',
      description: 'User is verified to be 21 or older',
      protocolId: passportProtocol.id,
      privateByDefault: true,
      metadata: {
        type: 'age',
        minAge: 21
      }
    }
  });

  const countryBadge = await prisma.badge.create({
    data: {
      name: 'Country Verified',
      slug: 'country-verified',
      description: 'User\'s country of residence has been verified',
      protocolId: passportProtocol.id,
      privateByDefault: false,
      expiresAfter: 730, // Expires after 2 years
      metadata: {
        type: 'country',
        description: 'Verifies country of residence'
      }
    }
  });

  // Create protocols that can issue these badges
  const googleProtocol = await prisma.protocol.create({
    data: {
      name: 'Sign in with Google',
      slug: 'google-signin',
      description: 'Verify using Google account',
      isActive: true,
      badges: {
        connect: [{ id: emailBadge.id }], // Google sign-in can issue email badge
      },
    },
  })

  const magicLinkProtocol = await prisma.protocol.create({
    data: {
      name: 'Magic Link',
      slug: 'magic-link',
      description: 'Verify using magic link sent to email',
      isActive: true,
      badges: {
        connect: [{ id: emailBadge.id }], // Magic link can also issue email badge
      },
    },
  })

  // Create communities
  const [pseCommunity, ageRestrictedCommunity, privateClub, msftCommunity] = await prisma.$transaction([
    prisma.community.create({
      data: {
        name: 'Privacy + Scaling Explorations',
        description: 'Privacy + Scaling Explorations is a multidisciplinary team supported by the Ethereum Foundation.',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        isPrivate: false,
        requiredBadges: {
          create: [
            {
              badge: {
                connect: { id: emailBadge.id },
              },
              requirements: {
                type: "domain",
                domains: ["ethereum.org", "pse.dev"],
                isPublic: true, // Everyone can see required domains
              },
            },
          ],
        },
      },
    }),
    prisma.community.create({
      data: {
        name: 'Age Restricted Community',
        description: 'A community for verified adults',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        isPrivate: false,
        requiredBadges: {
          create: [
            {
              badge: {
                connect: { id: age21Badge.id },
              },
              requirements: {
                type: "age",
                minAge: 21,
                isPublic: true,
              },
            },
          ],
        },
      },
    }),
    prisma.community.create({
      data: {
        name: 'Private Club',
        description: 'Exclusive club for specific members',
        avatar: 'https://example.com/club.png',
        isPrivate: true,
        requiredBadges: {
          create: [
            {
              badge: {
                connect: { id: emailBadge.id },
              },
              requirements: {
                type: "emails",
                emails: [
                  "founder@club.com",
                  "member1@gmail.com",
                  "member2@outlook.com"
                ],
                isPublic: false, // Hide the specific allowed emails
              },
            },
          ],
        },
      },
    }),
    prisma.community.create({
      data: {
        name: 'Microsoft Employees',
        description: 'Community for Microsoft employees',
        avatar: 'https://example.com/msft.png',
        isPrivate: true,
        requiredBadges: {
          create: [
            {
              badge: {
                connect: { id: emailBadge.id },
              },
              requirements: {
                type: "domain",
                domains: ["microsoft.com"],
                subdomains: true, // Allow any subdomain of microsoft.com
                isPublic: true,
              },
            },
          ],
        },
      },
    }),
  ])

  // Add badges to users (showing different protocols can issue same badge)
  await prisma.$transaction([
    // User got email badge through Google signin
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[0].id } },
        badge: { connect: { id: emailBadge.id } },
        isPublic: true,
        metadata: {
          email: 'kali@pse.dev',
          verifiedBy: 'google-signin',
          provider: 'google',
        },
        verifiedAt: new Date(),
      },
    }),
    // Another user got email badge through magic link
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[1].id } },
        badge: { connect: { id: emailBadge.id } },
        isPublic: true,
        metadata: {
          email: 'mario.rossi@pse.dev',
          verifiedBy: 'magic-link',
        },
        verifiedAt: new Date(),
      },
    }),
    // Add more badges for all users
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[0].id } },
        badge: { connect: { id: age18Badge.id } },
        isPublic: false,
        metadata: {
          age: 25,
          verifiedBy: 'age-verification',
        },
        verifiedAt: new Date(),
      },
    }),
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[1].id } },
        badge: { connect: { id: age21Badge.id } },
        isPublic: true,
        metadata: {
          age: 32,
          verifiedBy: 'age-verification',
        },
        verifiedAt: new Date(),
      },
    }),
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[2].id } },
        badge: { connect: { id: emailBadge.id } },
        isPublic: false,
        metadata: {
          email: 'john.doe@example.com',
          verifiedBy: 'magic-link',
        },
        verifiedAt: new Date(),
      },
    }),
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[2].id } },
        badge: { connect: { id: age18Badge.id } },
        isPublic: true,
        metadata: {
          age: 19,
          verifiedBy: 'age-verification',
        },
        verifiedAt: new Date(),
      },
    }),
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[3].id } },
        badge: { connect: { id: emailBadge.id } },
        isPublic: true,
        metadata: {
          email: 'atheartengineer@pse.dev',
          verifiedBy: 'google-signin',
        },
        verifiedAt: new Date(),
      },
    }),
    prisma.userBadge.create({
      data: {
        user: { connect: { id: users[3].id } },
        badge: { connect: { id: age21Badge.id } },
        isPublic: false,
        metadata: {
          age: 59,
          verifiedBy: 'age-verification',
        },
        verifiedAt: new Date(),
      },
    }),
  ])

  // Add users to communities
  await prisma.$transaction([
    prisma.communityMember.create({
      data: {
        community: { connect: { id: pseCommunity.id } },
        user: { connect: { id: users[0].id } },
      },
    }),
    prisma.communityMember.create({
      data: {
        community: { connect: { id: pseCommunity.id } },
        user: { connect: { id: users[1].id } },
      },
    }),
    prisma.communityMember.create({
      data: {
        community: { connect: { id: ageRestrictedCommunity.id } },
        user: { connect: { id: users[0].id } },
      },
    }),
  ])

  // Create some posts
  const posts = await prisma.$transaction([
    prisma.post.create({
      data: {
        title: 'Lorem ipsum dolor sit amet',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        author: { connect: { id: users[0].id } },
        community: { connect: { id: pseCommunity.id } },
        isAnon: false,
        totalViews: 1205,
        reactions: { like: 5, love: 2 },
      },
    }),
    prisma.post.create({
      data: {
        title: 'Neque porro quisquam',
        content: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
        author: { connect: { id: users[1].id } },
        community: { connect: { id: pseCommunity.id } },
        isAnon: false,
        totalViews: 892,
        reactions: { like: 3, wow: 1 },
      },
    }),
  ])

  // Create post replies
  await prisma.$transaction([
    prisma.postReply.create({
      data: {
        content: 'Great post! I found this really helpful for getting started.',
        post: { connect: { id: posts[0].id } },
        author: { connect: { id: users[1].id } },
        isAnon: false,
        childReplies: {
          create: [
            {
              content: 'Thanks for the feedback! I\'ll add more examples soon.',
              post: { connect: { id: posts[0].id } },
              author: { connect: { id: users[0].id } },
              isAnon: false,
            },
          ],
        },
      },
    }),
  ])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 