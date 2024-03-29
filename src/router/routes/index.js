// @ts-nocheck
const express = require("express");
const createError = require("http-errors");
const fs = require("fs");
const path = require("path");
const getSize = require("get-folder-size");
const dayjs = require("dayjs");
const router = express.Router();
const { zip, COMPRESSION_LEVEL } = require("zip-a-folder");
const StreamZip = require("node-stream-zip");

const editor_host = process.env.EDITOR_HOST || "";
const editor_port = process.env.EDITOR_PORT || "8443";

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
  const real_editor_host = editor_host || req.hostname;
  res.render("pages/index", {
    dirs: dirsData,
    editor_url: `//${real_editor_host}:${editor_port}/?folder=/config/workspace`,
  });
});

router.get("/download/:name", async function (req, res, next) {
  const timeNow = new Date().getTime();
  const filename = `./public/zip/${req.params.name}.${timeNow}.zip`;
  const reviewpath = `./public/review/${req.params.name}`;
  // const realPath = path.resolve(
  //   __dirname,
  //   `../../../public/zip/${req.params.name}.${timeNow}.zip`
  // );
  if (!fs.existsSync(filename)) {
    const f = fs.createWriteStream(filename + ".tmp", "base64");
    await zip(reviewpath, undefined, {
      compression: COMPRESSION_LEVEL.high,
      customWriteStream: f,
    });
    fs.renameSync(filename + ".tmp", filename);
  }
  // res.download(realPath);
  setTimeout(() => {
    fs.rmSync(filename);
  }, 60000);
  res.redirect(`/zip/${req.params.name}.${timeNow}.zip`);
});

router.post("/upload", async function (req, res, next) {
  const file = req.files?.file;
  const filename = file?.name?.substring(0, file.name.lastIndexOf("."));
  let reviewpath = `./public/review/${filename}`;
  if (fs.existsSync(reviewpath)) {
    reviewpath = reviewpath + "." + new Date().getTime();
  }
  try {
    const zip = new StreamZip.async({ file: file.tempFilePath });
    fs.mkdirSync(reviewpath);
    await zip.extract(null, reviewpath);
    await zip.close();
    if (fs.existsSync(file.tempFilePath)) {
      fs.rmSync(file.tempFilePath);
    }
    res.redirect("/");
  } catch (error) {
    try {
      if (fs.existsSync(reviewpath)) {
        fs.rmdirSync(reviewpath);
      }
    } catch (er) {}
    next(createError(500));
  }
});

module.exports = router;
