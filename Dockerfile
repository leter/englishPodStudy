# syntax=docker/dockerfile:1

# ---------- 构建阶段: 编译前端 ----------
FROM node:20-alpine AS build
WORKDIR /app

# 先复制依赖清单以利用缓存
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm install

# 复制源码并构建前端 (resource 通过 .dockerignore 排除, 运行时挂载)
COPY . .
RUN npm run build:web

# ---------- 运行阶段: 单进程同时托管 API 与前端 ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4173

# API 无第三方依赖, 仅需源码 + 前端产物
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/apps/web/dist ./apps/web/dist

EXPOSE 4173
CMD ["node", "apps/api/src/server.js"]
