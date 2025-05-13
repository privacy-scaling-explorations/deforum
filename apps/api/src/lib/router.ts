import { router } from './trpc';
import { postsRouter } from '../routers/posts';
import { protocolsRouter } from '../routers/protocols';
import { usersRouter } from '../routers/users';
import { communitiesRouter } from '../routers/communities';
import { badgesRouter } from '../routers/badges';
import { authRouter } from '../routers/auth';

export const appRouter = router({
  posts: postsRouter,
  protocols: protocolsRouter,
  users: usersRouter,
  communities: communitiesRouter,
  badges: badgesRouter,
  auth: authRouter
});

export type AppRouter = typeof appRouter;
