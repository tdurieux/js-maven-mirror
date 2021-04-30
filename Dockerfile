FROM node:12

RUN useradd -rm -d /home/runner -s /bin/bash -G sudo runner
USER runner

ENV PORT 5956

VOLUME /data

EXPOSE $PORT

WORKDIR /home/runner/

COPY package*.json ./

RUN npm install
COPY index.js .
COPY mirrors.js .

CMD [ "node index", "index.js", "/data/" ]