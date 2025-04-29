import { router } from '../lib/trpc';
import { usersRouter } from './users';
import { postsRouter } from './posts';
import { communitiesRouter } from './communities';
import { badgesRouter } from './badges';
import { protocolsRouter } from './protocols';

export const appRouter = router({
  users: usersRouter,
  posts: postsRouter,
  communities: communitiesRouter,
  badges: badgesRouter,
  protocols: protocolsRouter,
});

export type AppRouter = typeof appRouter; 