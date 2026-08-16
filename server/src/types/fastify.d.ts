import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { parent_id?: number; phone?: string; role?: string } | null
  }
}
