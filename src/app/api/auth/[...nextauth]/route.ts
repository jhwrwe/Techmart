// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/lib/auth/config';

// Next.js App Router expects `route.ts` to export named HTTP handlers:
export const { GET, POST } = handlers;
