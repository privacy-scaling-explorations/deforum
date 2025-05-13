import { PrismaClient } from '@prisma/client';
import { Group } from '@semaphore-protocol/group';

const prisma = new PrismaClient();

// Helper function to generate dummy Semaphore proof data
function generateDummyProof(communityId: string) {
  // Create a dummy group with a single member
  const group = new Group([generatePublicKey()]);

  return {
    proof:
      '0x' +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join(''),
    nullifier:
      '0x' +
      Array(32)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join(''),
    publicSignals: [
      group.root.toString(),
      ...Array(2)
        .fill(0)
        .map(
          () =>
            '0x' +
            Array(16)
              .fill(0)
              .map(() => Math.floor(Math.random() * 16).toString(16))
              .join('')
        )
    ],
    merkleRoot: {
      create: {
        communityId,
        merkleRoot: JSON.stringify({
          members: group.members.map((m) => m.toString()),
          root: group.root.toString()
        })
      }
    }
  };
}

// Helper function to generate a random public key
function generatePublicKey() {
  return (
    '0x' +
    Array(40)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('')
  );
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users
  console.log('Creating users...');
  const users = await prisma.$transaction([
    prisma.user.create({
      data: {
        id: '1e900107-5e56-4d74-91d9-25c191749fcf',
        username: 'Anonymous',
        isAnon: true,
        showFollowers: true,
        showFollowing: true
      }
    }),
    prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        username: 'kali',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'kali@pse.dev',
        bio: 'Fullstack developer at PSE',
        isAnon: false,
        showFollowers: true,
        showFollowing: false,
        publicKeys: {
          create: {
            publicKey: generatePublicKey()
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        username: 'Mari',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'mari@pse.dev',
        bio: 'UX Designer at PSE',
        isAnon: false,
        showFollowers: false,
        showFollowing: false,
        publicKeys: {
          create: {
            publicKey: generatePublicKey()
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        username: 'Mario Bianchi',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'mario.bianchi@microsoft.com',
        website: 'https://example.com',
        bio: 'Software Engineer at Microsoft',
        isAnon: false,
        showFollowers: true,
        showFollowing: true,
        publicKeys: {
          create: {
            publicKey: generatePublicKey()
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        id: 'e5f67f78-9012-5678-3ef0-5678901234ef',
        username: 'AtHeartEngineer',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        email: 'atheartengineer@pse.dev',
        bio: '🪐 Stay Curious',
        isAnon: false,
        showFollowers: true,
        showFollowing: true,
        publicKeys: {
          create: {
            publicKey: generatePublicKey()
          }
        }
      }
    })
  ]);

  // Helper function to get user ID by username
  const getUserId = (username: string) => {
    const user = users.find((u: { username: string; id: string }) => u.username === username);
    if (!user) throw new Error(`User ${username} not found`);
    return user.id;
  };

  // Create protocols
  console.log('Creating protocols...');
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

  const dummyProtocol = await prisma.protocol.create({
    data: {
      name: 'Dummy Protocol',
      slug: 'dummy-protocol',
      description: 'A dummy protocol for testing',
      isActive: true
    }
  });

  // Create badge definitions
  console.log('Creating badge definitions...');
  const [pseBadge, msftBadge, age21Badge, trustedEmailsBadge, dummyBadge] =
    await prisma.$transaction([
      prisma.badgeDefinition.create({
        data: {
          name: 'PSE Email',
          slug: 'pse-email',
          description: 'Verified PSE email address',
          protocols: {
            create: [
              {
                protocol: { connect: { id: emailProtocol.id } }
              }
            ]
          },
          privateByDefault: false,
          metadata: {
            type: 'email',
            domains: ['pse.dev'],
            description: 'Verifies PSE email ownership'
          }
        }
      }),
      prisma.badgeDefinition.create({
        data: {
          name: 'Microsoft Email',
          slug: 'microsoft-email',
          description: 'Verified Microsoft email address',
          protocols: {
            create: [
              {
                protocol: { connect: { id: emailProtocol.id } }
              }
            ]
          },
          privateByDefault: false,
          metadata: {
            type: 'email',
            domains: ['microsoft.com'],
            description: 'Verifies Microsoft email ownership'
          }
        }
      }),
      prisma.badgeDefinition.create({
        data: {
          name: 'Over 21',
          slug: 'over-21',
          description: 'Verified age over 21',
          protocols: {
            create: [
              {
                protocol: { connect: { id: passportProtocol.id } }
              }
            ]
          },
          privateByDefault: true,
          metadata: {
            type: 'age',
            minAge: 21,
            description: 'Verifies age is over 21'
          }
        }
      }),
      prisma.badgeDefinition.create({
        data: {
          name: 'Trusted Email',
          slug: 'trusted-email',
          description: 'Email from trusted domain',
          protocols: {
            create: [
              {
                protocol: { connect: { id: emailProtocol.id } }
              }
            ]
          },
          privateByDefault: false,
          metadata: {
            type: 'email',
            domains: ['gmail.com', 'outlook.com', 'yahoo.com'],
            description: 'Verifies email from trusted domains'
          }
        }
      }),
      prisma.badgeDefinition.create({
        data: {
          name: 'Dummy Badge',
          slug: 'dummy-badge',
          description: 'A dummy badge for testing',
          protocols: {
            create: [
              {
                protocol: { connect: { id: dummyProtocol.id } }
              }
            ]
          },
          privateByDefault: false,
          metadata: {
            type: 'dummy',
            description: 'A dummy badge for testing purposes'
          }
        }
      })
    ]);

  // Issue badges to users
  console.log('Issuing badges to users...');
  await prisma.$transaction([
    // PSE badges for PSE team
    ...['kali', 'Mari', 'AtHeartEngineer'].map((username) =>
      prisma.badgeCredential.create({
        data: {
          user: { connect: { id: getUserId(username) } },
          definition: { connect: { id: pseBadge.id } },
          isPublic: true,
          verifiedAt: new Date(),
          metadata: { email: `${username.toLowerCase().replace(' ', '.')}@pse.dev` }
        }
      })
    ),
    // Microsoft badge for Mario Bianchi
    prisma.badgeCredential.create({
      data: {
        user: { connect: { id: getUserId('Mario Bianchi') } },
        definition: { connect: { id: msftBadge.id } },
        isPublic: true,
        verifiedAt: new Date(),
        metadata: { email: 'mario.bianchi@microsoft.com' }
      }
    }),
    // Age verification for all non-anonymous users
    ...['kali', 'Mari', 'Mario Bianchi', 'AtHeartEngineer'].map((username) =>
      prisma.badgeCredential.create({
        data: {
          user: { connect: { id: getUserId(username) } },
          definition: { connect: { id: age21Badge.id } },
          isPublic: false,
          verifiedAt: new Date(),
          metadata: { age: 25 }
        }
      })
    )
  ]);

  // Issue trusted emails badge for users with qualifying domains
  console.log('Issuing trusted emails badges...');
  const trustedEmailsCredentials = ['kali', 'Mari', 'AtHeartEngineer', 'Mario Bianchi']
    .map((username) => {
      const user = users.find((u: { username: string }) => u.username === username);
      if (!user?.email) return null;
      const emails = (trustedEmailsBadge.metadata as { emails: string[] })?.emails || [];
      if (!emails.includes(user.email)) return null;
      return {
        user: { connect: { id: user.id } },
        definition: { connect: { id: trustedEmailsBadge.id } },
        isPublic: true,
        verifiedAt: new Date(),
        metadata: { email: user.email }
      };
    })
    .filter((data): data is NonNullable<typeof data> => data !== null);

  // Create communities with badge requirements
  console.log('Creating communities...');
  const [pseCommunity, msftCommunity, age21Community, testCommunity] = await prisma.$transaction([
    prisma.community.create({
      data: {
        name: 'Privacy + Scaling Explorations',
        slug: 'pse',
        description: 'Official PSE community for discussing privacy and scaling solutions.',
        avatar: 'https://pse.dev/logos/pse-logo-bg.svg',
        isPrivate: false,
        requiredBadges: {
          create: [
            {
              badge: { connect: { id: pseBadge.id } },
              requirements: {
                type: 'domain',
                domains: ['pse.dev'],
                isPublic: true
              }
            }
          ]
        }
      }
    }),
    prisma.community.create({
      data: {
        name: 'Microsoft Internal',
        slug: 'microsoft',
        description: 'Internal community for Microsoft employees',
        avatar: 'https://example.com/msft.png',
        isPrivate: true,
        requiredBadges: {
          create: [
            {
              badge: { connect: { id: msftBadge.id } },
              requirements: {
                type: 'domain',
                domains: ['microsoft.com'],
                isPublic: true
              }
            }
          ]
        }
      }
    }),
    prisma.community.create({
      data: {
        name: '21+ Community',
        slug: '21-plus',
        description: 'A community for verified adults',
        isPrivate: false,
        requiredBadges: {
          create: [
            {
              badge: { connect: { id: age21Badge.id } },
              requirements: {
                type: 'age',
                minAge: 21,
                isPublic: true
              }
            }
          ]
        }
      }
    }),
    prisma.community.create({
      data: {
        name: 'Test Community',
        slug: 'test',
        description: 'A test community that requires the dummy badge',
        isPrivate: false,
        requiredBadges: {
          create: [
            {
              badge: { connect: { id: dummyBadge.id } },
              requirements: {
                type: 'dummy',
                isPublic: true
              }
            }
          ]
        }
      }
    })
  ]);

  // Add users to communities (only if they have required badges)
  console.log('Adding users to communities...');
  await prisma.$transaction([
    // PSE members to PSE community
    ...['kali', 'Mari', 'AtHeartEngineer'].map((username) =>
      prisma.communityMember.create({
        data: {
          community: { connect: { id: pseCommunity.id } },
          user: { connect: { id: getUserId(username) } },
          role: username === 'AtHeartEngineer' ? 'ADMIN' : 'MEMBER'
        }
      })
    ),
    // Microsoft employee to Microsoft community
    prisma.communityMember.create({
      data: {
        community: { connect: { id: msftCommunity.id } },
        user: { connect: { id: getUserId('Mario Bianchi') } },
        role: 'MEMBER'
      }
    }),
    // All verified users to age 21+ community
    ...['kali', 'Mari', 'Mario Bianchi', 'AtHeartEngineer'].map((username) =>
      prisma.communityMember.create({
        data: {
          community: { connect: { id: age21Community.id } },
          user: { connect: { id: getUserId(username) } }
        }
      })
    )
  ]);

  // Create posts and replies in communities
  console.log('Creating posts and replies...');

  // PSE Community Posts
  const psePost1 = await prisma.post.create({
    data: {
      title: 'Welcome to Privacy + Scaling Explorations',
      content:
        'This is our official community for discussing privacy and scaling solutions in blockchain technology.',
      author: { connect: { id: getUserId('AtHeartEngineer') } },
      community: { connect: { id: pseCommunity.id } },
      postType: 'COMMUNITY',
      isAnon: false,
      totalViews: 1205,
      reactions: {
        create: [
          {
            emoji: '👍',
            proofMetadata: {
              create: generateDummyProof(pseCommunity.id)
            }
          },
          {
            emoji: '❤️',
            proofMetadata: {
              create: generateDummyProof(pseCommunity.id)
            }
          }
        ]
      }
    }
  });

  await prisma.$transaction([
    prisma.postReply.create({
      data: {
        content: 'Excited to be part of this community!',
        post: { connect: { id: psePost1.id } },
        author: { connect: { id: getUserId('kali') } },
        isAnon: false,
        childReplies: {
          create: [
            {
              content: 'Welcome! Looking forward to your contributions.',
              authorId: getUserId('AtHeartEngineer'),
              postId: psePost1.id,
              isAnon: false
            }
          ]
        }
      }
    }),
    prisma.postReply.create({
      data: {
        content: 'Great initiative! When is the next community call?',
        post: { connect: { id: psePost1.id } },
        author: { connect: { id: getUserId('Mari') } },
        isAnon: false
      }
    })
  ]);

  const psePost2 = await prisma.post.create({
    data: {
      title: 'Latest Updates on Zero Knowledge Proofs',
      content: "Let's discuss the recent advancements in ZK technology and their implications.",
      author: { connect: { id: getUserId('kali') } },
      community: { connect: { id: pseCommunity.id } },
      postType: 'COMMUNITY',
      isAnon: false,
      totalViews: 892,
      reactions: {
        create: [
          {
            emoji: '👍',
            proofMetadata: {
              create: generateDummyProof(pseCommunity.id)
            }
          },
          {
            emoji: '🤯',
            proofMetadata: {
              create: generateDummyProof(pseCommunity.id)
            }
          }
        ]
      }
    }
  });

  await prisma.postReply.create({
    data: {
      content: 'The performance improvements are really impressive!',
      post: { connect: { id: psePost2.id } },
      author: { connect: { id: getUserId('Mari') } },
      isAnon: false,
      childReplies: {
        create: [
          {
            content: 'Agreed! The latest benchmarks show a 50% improvement.',
            authorId: getUserId('kali'),
            postId: psePost2.id,
            isAnon: false
          }
        ]
      }
    }
  });

  // Microsoft Community Posts
  const msftPost = await prisma.post.create({
    data: {
      title: 'Internal Discussion: Web3 Integration',
      content: 'Discussing potential Web3 integration points for our cloud services.',
      author: { connect: { id: getUserId('Mario Bianchi') } },
      community: { connect: { id: msftCommunity.id } },
      postType: 'COMMUNITY',
      isAnon: false,
      totalViews: 156,
      reactions: {
        create: [
          {
            emoji: '👍',
            proofMetadata: {
              create: generateDummyProof(msftCommunity.id)
            }
          },
          {
            emoji: '💡',
            proofMetadata: {
              create: generateDummyProof(msftCommunity.id)
            }
          }
        ]
      }
    }
  });

  await prisma.postReply.create({
    data: {
      content: 'Here are my thoughts on the integration points...',
      post: { connect: { id: msftPost.id } },
      author: { connect: { id: getUserId('Mario Bianchi') } },
      isAnon: false
    }
  });

  // Age 21+ Community Posts
  const agePost = await prisma.post.create({
    data: {
      title: 'Age Verification in Web3',
      content: 'How can we implement age verification while preserving privacy?',
      author: { connect: { id: getUserId('AtHeartEngineer') } },
      community: { connect: { id: age21Community.id } },
      postType: 'COMMUNITY',
      isAnon: false,
      totalViews: 456,
      reactions: {
        create: [
          {
            emoji: '👍',
            proofMetadata: {
              create: generateDummyProof(age21Community.id)
            }
          },
          {
            emoji: '🤔',
            proofMetadata: {
              create: generateDummyProof(age21Community.id)
            }
          }
        ]
      }
    }
  });

  await prisma.$transaction([
    prisma.postReply.create({
      data: {
        content: 'Zero-knowledge proofs could be a solution!',
        post: { connect: { id: agePost.id } },
        author: { connect: { id: getUserId('kali') } },
        isAnon: false,
        childReplies: {
          create: [
            {
              content: 'Exactly! We could prove age without revealing the exact birthdate.',
              authorId: getUserId('Mari'),
              postId: agePost.id,
              isAnon: false
            }
          ]
        }
      }
    }),
    prisma.postReply.create({
      data: {
        content: 'What about compliance with different jurisdictions?',
        post: { connect: { id: agePost.id } },
        author: { connect: { id: getUserId('Mario Bianchi') } },
        isAnon: false
      }
    })
  ]);

  // Create some posts with reactions
  console.log('Creating posts with reactions...');
  const posts = await prisma.$transaction([
    prisma.post.create({
      data: {
        title: 'Welcome to Deforum!',
        content: 'This is my first post. We are excited to have you here!',
        author: { connect: { id: getUserId('kali') } },
        postType: 'PROFILE',
        signatureMetadata: '0x1234567890abcdef',
        reactions: {
          create: [
            {
              emoji: '👍',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            },
            {
              emoji: '🚀',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            },
            {
              emoji: '❤️',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            }
          ]
        }
      }
    }),
    prisma.post.create({
      data: {
        title: 'Anonymous posting is now live!',
        content: 'You can now post anonymously using zero-knowledge proofs.',
        author: { connect: { id: getUserId('AtHeartEngineer') } },
        postType: 'PROFILE',
        isAnon: true,
        proofMetadata: {
          create: generateDummyProof(pseCommunity.id)
        },
        reactions: {
          create: [
            {
              emoji: '🎭',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            },
            {
              emoji: '🔐',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            }
          ]
        }
      }
    })
  ]);

  // Add some replies with reactions
  console.log('Creating replies with reactions...');
  await prisma.$transaction([
    prisma.postReply.create({
      data: {
        content: 'This is amazing! Love the privacy features.',
        post: { connect: { id: posts[1].id } },
        author: { connect: { id: getUserId('Mari') } },
        signatureMetadata: '0x1234567890abcdef',
        reactions: {
          create: [
            {
              emoji: '💯',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            }
          ]
        }
      }
    }),
    prisma.postReply.create({
      data: {
        content: 'Testing anonymous replies too!',
        post: { connect: { id: posts[1].id } },
        isAnon: true,
        proofMetadata: {
          create: generateDummyProof(pseCommunity.id)
        },
        reactions: {
          create: [
            {
              emoji: '👻',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            },
            {
              emoji: '🎉',
              proofMetadata: {
                create: generateDummyProof(pseCommunity.id)
              }
            }
          ]
        }
      }
    })
  ]);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
