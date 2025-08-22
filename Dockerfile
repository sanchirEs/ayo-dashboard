FROM node:18 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Declare build args for frontend vars
ARG NEXT_PUBLIC_BACKEND_URL
ARG NEXT_PUBLIC_FRONTEND_URL

# Make them available to Next.js build
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL

RUN npm run build

FROM node:18 AS runner
WORKDIR /app

COPY --from=builder /app ./

CMD ["npm", "run", "start"]
