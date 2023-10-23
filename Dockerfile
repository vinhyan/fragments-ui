# Stage 0: Install dependencies

FROM node:18.17.0@sha256:c85dc4392f44f5de1d0d72dd20a088a542734445f99bed7aa8ac895c706d370d AS dependencies

LABEL maintainer="Vinh Nhan <vnhan1@myseneca.ca>" \ 
      description="Fragments UI"

# To make this happens in production
ENV NODE-ENV=production

WORKDIR /site

# copy package.json and package-lock.json to /site
COPY package*.json ./

RUN npm install


#############################################

# Stage 1: Build the app

FROM node:18.17.0@sha256:c85dc4392f44f5de1d0d72dd20a088a542734445f99bed7aa8ac895c706d370d AS build

WORKDIR /site

COPY --from=dependencies /site /site

COPY ./src ./src

RUN npm run build

#############################################

# Stage 3: Run the app

FROM nginx:1.24.0-alpine@sha256:62cabd934cbeae6195e986831e4f745ee1646c1738dbd609b1368d38c10c5519 AS deploy

COPY --from=build /site/dist /usr/share/nginx/html

# FROM node:18.17.0@sha256:c85dc4392f44f5de1d0d72dd20a088a542734445f99bed7aa8ac895c706d370d AS deploy

# WORKDIR /site

# COPY --from=build /site /site

# CMD npm start

EXPOSE 80

