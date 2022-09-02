// @ts-nocheck
const express = require("express");
const fs = require("fs");
const path = require("path");
const getSize = require("get-folder-size");
const dayjs = require("dayjs");
const router = express.Router();
const { zip, COMPRESSION_LEVEL } = require("zip-a-folder");

function getFolderSize(path) {
  return new Promise((resolve, reject) => {
    getSize(path, (err, size) => {
      if (err) {
        reject(err);
      }
      resolve(size);
    });
  });
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  const dirs = fs.readdirSync("./public/review").filter((f) => f !== ".keep");
  const dirsData = [];
  for (let index = 0; index < dirs.length; index++) {
    const dir = dirs[index];
    const stat = fs.statSync(`./public/review/${dir}`);
    const size = await getFolderSize(`./public/review/${dir}`);
    dirsData.push({
      name: dir,
      mtime: dayjs(stat.mtime).format("YYYY-MM-DD HH:mm:ss"),
      size: size,
    });
  }
  res.render("pages/index", { dirs: dirsData });
});

/* GET home page. */
router.get("/download/:name", async function (req, res, next) {
  const timeNow = new Date().getTime();
  const filename = `./public/zip/${req.params.name}.${timeNow}.zip`;
  const reviewpath = `./public/review/${req.params.name}`;
  const realPath = path.resolve(__dirname,`../../../public/zip/${req.params.name}.${timeNow}.zip`)
  console.log(realPath);
  if (!fs.existsSync(filename)) {
    const f = fs.createWriteStream(filename + ".tmp","base64");
    await zip(reviewpath, undefined, {
      compression: COMPRESSION_LEVEL.high,
      customWriteStream: f,
    });
    fs.renameSync(filename + ".tmp", filename);
  }
  // res.download(realPath);
  setTimeout(() => {
    fs.unlinkSync(filename)
  }, 60000);
  res.redirect(`/zip/${req.params.name}.${timeNow}.zip`);
});

module.exports = router;
