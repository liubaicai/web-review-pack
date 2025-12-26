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

/* 目录浏览 - 当没有index.html时显示文件列表 */
router.get("/review/:name", async function (req, res, next) {
  const reviewpath = `./public/review/${req.params.name}`;
  const indexPath = path.join(reviewpath, "index.html");
  
  // 如果存在index.html，让express.static处理
  if (fs.existsSync(indexPath)) {
    return next();
  }
  
  // 如果目录不存在
  if (!fs.existsSync(reviewpath)) {
    return next();
  }
  
  // 读取目录内容
  try {
    const files = fs.readdirSync(reviewpath);
    const filesData = files.map(file => {
      const filePath = path.join(reviewpath, file);
      const stat = fs.statSync(filePath);
      return {
        name: file,
        isDir: stat.isDirectory(),
        size: stat.size,
        mtime: dayjs(stat.mtime).format("YYYY-MM-DD HH:mm:ss")
      };
    });
    
    // 排序：文件夹在前，然后按名称排序
    filesData.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.render("pages/directory", {
      dirName: req.params.name,
      files: filesData,
      parentPath: "/"
    });
  } catch (error) {
    next(error);
  }
});

/* 子目录浏览 */
router.get("/review/:name/*", async function (req, res, next) {
  const subPath = req.params[0];
  const reviewpath = `./public/review/${req.params.name}/${subPath}`;
  const indexPath = path.join(reviewpath, "index.html");
  
  // 如果是文件或存在index.html，让express.static处理
  if (!fs.existsSync(reviewpath) || !fs.statSync(reviewpath).isDirectory() || fs.existsSync(indexPath)) {
    return next();
  }
  
  // 读取目录内容
  try {
    const files = fs.readdirSync(reviewpath);
    const filesData = files.map(file => {
      const filePath = path.join(reviewpath, file);
      const stat = fs.statSync(filePath);
      return {
        name: file,
        isDir: stat.isDirectory(),
        size: stat.size,
        mtime: dayjs(stat.mtime).format("YYYY-MM-DD HH:mm:ss")
      };
    });
    
    filesData.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.render("pages/directory", {
      dirName: `${req.params.name}/${subPath}`,
      files: filesData,
      parentPath: (function() {
        // 移除末尾斜杠后计算父路径
        const cleanSubPath = subPath.replace(/\/+$/, '');
        const lastSlash = cleanSubPath.lastIndexOf('/');
        if (lastSlash > 0) {
          return `/review/${req.params.name}/${cleanSubPath.substring(0, lastSlash)}`;
        }
        return `/review/${req.params.name}`;
      })()
    });
  } catch (error) {
    next(error);
  }
});

router.post("/upload", async function (req, res, next) {
  const file = req.files?.file;
  // 移除文件名中的空格
  const rawFilename = file?.name?.substring(0, file.name.lastIndexOf("."));
  const filename = rawFilename?.replace(/\s+/g, "");
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
