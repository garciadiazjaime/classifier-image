const tf = require("@tensorflow/tfjs");
const mobilenet = require("@tensorflow-models/mobilenet");
const tfnode = require("@tensorflow/tfjs-node");
const fs = require("fs");
const fetch = require("node-fetch");

const { getImage, savePosts, deletePost } = require("./support/dynamo");
const { loggerInfo: loggerInfoHelper } = require("./support/log");

const loggerInfo = (msg) => {
  loggerInfoHelper(`classifier-image: ${msg}`);
};

const downloadImage = async (path) => {
  loggerInfo(`downloading image: ${path}`);

  const response = await fetch(path);
  const imageBuffer = Buffer.from(await response.arrayBuffer());

  fs.writeFileSync("./image.jpg", imageBuffer);

  const image = tfnode.node.decodeImage(imageBuffer);

  return image;
};

const getImageClassification = async (image) => {
  const model = await mobilenet.load();
  const classification = await model.classify(image);

  return classification;
};

async function main() {
  const oldestPost = await getImage();

  if (oldestPost.count < 2) {
    loggerInfo(`WARN: less than two posts, skipping`);
    return;
  }

  if (!oldestPost?.post?.secure_url) {
    loggerInfo(`ERROR: invalid URL: ${JSON.stringify(oldestPost)}`);
    return;
  }

  const image = await downloadImage(oldestPost.post.secure_url);

  const classification = await getImageClassification(image);

  loggerInfo(`Classification Results: ${JSON.stringify(classification)}`);

  const newPost = {
    ...oldestPost.post,
    classification,
  };

  await savePosts(newPost);

  await deletePost(newPost.id, newPost.taken_at_timestamp);

  loggerInfo("post saved");
}

main();
