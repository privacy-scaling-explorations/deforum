
## MVP v1 (Early May)
* [x] Add User Following/Followers feature to the backend/db schema
* [ ] Wire up reactions to the frontend (reading from the db)

* [ ] Implement sign-in with passkeys 
* [ ] Implement keys
    * [ ] Key generation
    * [ ] Key signing and verification for authorization functions (posting, replies, changing settings)
* [ ] Posts/Replies
    * [ ] Create signed posts/replies (to communities and to profile pages)
    * [ ] Edit signed posts/replies
* [ ] Semaphore proofs
    * [ ] Write the merkle root generation mechanisms on the server
    * [ ] Wire up the triggers for merkle root generation
    * [ ] Wire up reactions to the frontend (submitting reactions)
    * [ ] Wire up anon posts and replies
* [ ] User settings page
    * [ ] Add language settings to user database
    * [ ] Wire up frontend to settings page
    * [ ] Manual Key rotation
* Add credentials
    * [ ] Google OAuth using modified Stealthnote circuits
    * [ ] Magic Link

## v2 (Early June)
* [ ] Community permissions/settings page
* [ ] Community creation page
* [ ] Home page with infinite scroll (for communities and people you follow)
* [ ] Automatically create communities based on certain credentials (email domain, country, etc)
* [ ] Migrate Freedit db
* Add Credentials
    * [ ] ECDSA (could we use ECDSA signatures with OPRF to get nullifiers faster than PLUME or Anonclub?)
        * NFTs (POAPs & DAOs primarily) (LETS MAKE POAPS USEFUL! prove to me that youve been to a devcon/nect)
        * Eth Balance
        * DAO hack
        * Genesis depositors
    * [ ] TLSNotary
        * ID.me
        * Twitter followers?? (if twitter stops breaking their API)
        * Steam?
        

## v3 (Early July)
* [ ] OPRF integration for critical things
* Add Credentials:
    * [ ] Passports
    * [ ] Anon Aadhaar
    * [ ] ZKEmail (with OPRF nullifiers)
    * [ ] BLS (current validators)
* VC/VP compatibility?
* Start testing and integrating identity wallets
    * [ ] Zupass
    * [ ] Rarimo
    * [ ] Privado

## Bonus (Will get to when people start wanting it)

* [ ] Multi-device support
* [ ] Account recovery (by proving some fact about yourself, matching a nullifer)
* [ ] Chat
* [ ] Polls
* [ ] Markdown support
* [ ] LATEX support
* [ ] (Push) Notifications (doing this privately might be a research task in itself)
* [ ] Mobile app
* [ ] Collab/reviewable draft posts (request from Sam, similar to my idea for FreedInk)
* [ ] Real time updates
* [ ] AA wallets
* [ ] On chain user registry that works across instances (need OPRF first)
* [ ] Local first/offline support
* [ ] More granular permissions for communities (X badge gets you read access, X + Y gets you post, X + Y + Z gets you moderation)
* [ ] Badge Scores
    * Gamification
    * Sybil Score (maybe not a #, but a percentile compared to other users)
    * Max number of points per badge type, that way someone can't game the system by adding a bunch of lower tier/easier badges to mimick the quality of a passport
* [ ] Reputation
    * Unirep?
    * Global reputation?
    * Local reputation?