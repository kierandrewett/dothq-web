FROM nginx:alpine

RUN apk --update --allow-untrusted \
    --repository http://dl-4.alpinelinux.org/alpine/latest-stable/community \
    add tor nodejs

RUN sudo npm i typescript ts-node -g
RUN ts-node index.ts

COPY nginx.conf /etc/nginx
COPY sites-available /etc/nginx
COPY torrc /etc/tor/torrc

RUN mkdir -p /var/lib/tor/hidden_service

RUN chown -R tor:tor /var/lib/tor/hidden_service/*
RUN chmod 600 /var/lib/tor/hidden_service/*

COPY start.sh /home/start.sh
RUN chmod +x /home/start.sh && /home/start.sh