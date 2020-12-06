const express = require("express");
const request = require("request");
const fs = require("fs");
const path = require("path");
const urljoin = require("url-join");
const async = require("async");
const PassThrough = require("stream").PassThrough;

const mirrors = require("./mirrors");
const acceptedExtensions = [".jar", ".pom", ".xml", ".md5", ".sha1", ".asc"];
const app = express();
const port = 5956;

const cachePath = fs.realpathSync(process.argv[2]);

app.use(express.static(cachePath));

app.get("*", (req, res) => {
  let isAccepted = false;
  for (let ext of acceptedExtensions) {
    if (req.path.endsWith(ext)) {
      isAccepted = true;
      break;
    }
  }
  async.detectLimit(
    mirrors,
    1,
    (mirror, callback) => {
      const uri = urljoin(mirror, req.path);
      try {
        const mavenRequest = request
          .get(uri)
          .on("response", (mavenResponse) => {
            if (mavenResponse.statusCode === 200) {
              try {
                const passThroughResponse = new PassThrough();
                mavenRequest.pipe(passThroughResponse);

                if (isAccepted) {
                  const passThroughFile = new PassThrough();
                  mavenRequest.pipe(passThroughFile);
                  fs.mkdirSync(path.dirname(path.join(cachePath, req.path)), {
                    recursive: true,
                  });
                  passThroughFile.pipe(
                    fs.createWriteStream(path.join(cachePath, req.path))
                  );
                }

                passThroughResponse.pipe(res);
                return callback(null, true);
              } catch (error) {
                console.error(error);
              }
            }
            callback(null, false);
          })
          .on("error", () => {
            callback(null, false);
          });
      } catch (error) {
        console.error(error);
        callback(null, false);
      }
    },
    (err, value) => {
      if (value === undefined) {
        const message = `[ERROR] File: '${req.path}' not found!`;
        console.log(message);
        res.status(404).send(message);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
