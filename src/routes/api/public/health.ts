import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/public/health')({
  server: {
    handlers: {
      GET: async () => {
        return new Response('OK', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      },
    },
  },
})
