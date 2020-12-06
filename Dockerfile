FROM node:12

ARG USER_ID
ARG GROUP_ID

RUN groupadd -r --gid $GROUP_ID runner; exit 0
RUN useradd -rm -d /home/runner -s /bin/bash -G sudo --uid $USER_ID --gid $GROUP_ID runner
USER runner

ENV PORT 5956

VOLUME /data

EXPOSE $PORT

WORKDIR /home/runner/

COPY package*.json ./

RUN npm install
RUN npm install forever
COPY index.js .
COPY mirrors.js .

ENTRYPOINT [ "./node_modules/.bin/forever", "index.js", "/data/" ]