FROM node:17-alpine

WORKDIR /worker/build
COPY . /worker/build

ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start", "-p", "3000"]