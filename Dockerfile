ARG NODE_IMAGE=node:16.15.1-alpine

# stage 1 building the code
# FROM $NODE_IMAGE AS builder
# WORKDIR /app
# COPY ./package*.json ./
# RUN npm install
# COPY . .
# RUN node ace build --production

#stage 2
# FROM $NODE_IMAGE
# WORKDIR /app
# COPY ./package*.json ./
# RUN npm ci --production

# COPY --from=builder /app/build ./build
# COPY .env ./build

# EXPOSE 3334
# CMD ["node" , "./build/server.js"]


FROM $NODE_IMAGE AS base
RUN apk --no-cache add dumb-init
RUN mkdir -p /app && chown node:node /app
WORKDIR /app
USER node
RUN mkdir tmp

FROM base AS dependencies
COPY --chown=node:node ./package*.json ./
RUN npm ci
COPY --chown=node:node . .

FROM dependencies AS build
RUN node ace build --production

FROM base AS production
COPY --chown=node:node ./package*.json ./
RUN npm ci --production
COPY --chown=node:node --from=build /app/build .
EXPOSE $PORT
CMD [ "dumb-init", "node", "server.js" ]
