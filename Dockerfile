FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de configuration du package manager
COPY package.json pnpm-lock.yaml ./

# Installer pnpm et les dépendances
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Variables d'environnement pour le build (ajoutez vos variables si nécessaire)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build de l'application
RUN pnpm build

# Stage de production
FROM node:18-alpine AS runner

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Installer pnpm et les dépendances de production
RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

# Copier les fichiers buildés
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Optionnel: copier next.config.ts si vous en avez un
COPY --from=builder /app/next.config.ts ./

# Changer vers l'utilisateur non-root
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]