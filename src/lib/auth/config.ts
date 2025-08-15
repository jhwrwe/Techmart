import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { users, accounts, sessions, verificationTokens } from '@/lib/db/schema'
import type { Session } from 'next-auth'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async session({
      session,
      user,
    }: {
      session: Session
      user: unknown
    }): Promise<Session> {
      const s = session as unknown as Record<string, unknown> & {
        user?: Record<string, unknown>
      }

      if (s.user && typeof user === 'object' && user !== null) {
        const u = user as Record<string, unknown>

        if (typeof u['id'] === 'string' || typeof u['id'] === 'number') {
          s.user!['id'] = u['id']
        }

        s.user!['role'] = typeof u['role'] === 'string' ? u['role'] : 'user'
      }

      return s as unknown as Session
    },

    async jwt({
      token,
      user,
    }: {
      token: Record<string, unknown>
      user?: unknown
    }): Promise<Record<string, unknown>> {
      const t = { ...token } as Record<string, unknown>

      if (typeof user === 'object' && user !== null) {
        const u = user as Record<string, unknown>
        if (typeof u['role'] === 'string') {
          t['role'] = u['role']
        }
      }

      return t
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('User signed in', {
        email: user.email,
        isNewUser,
        provider: account?.provider,
      })
    },
  },
})
