const AWS = require("aws-sdk");

require("dotenv").config();

const awsParams = {
  region: "us-east-1",
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
};

AWS.config.update(awsParams);

const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports.savePosts = async (data) => {
  const params = {
    TableName: "instagram_classified",
    Item: {
      ...data
    },
  };

  return documentClient.put(params).promise();
};

const getData = async (TableName, Limit) => {
  const params = {
    TableName,
    Limit,
  };

  return documentClient.scan(params).promise();
};

async function getSortedImages() {
  const results = await getData("instagram_processed");

  if (!Array.isArray(results.Items) || !results.Items.length) {
    return [];
  }

  return results.Items.sort(
    (a, b) => a.taken_at_timestamp - b.taken_at_timestamp
  );
}

module.exports.getImage = async (sort) => {
  const sortedImages = await getSortedImages();

  const post =
    sort === "newest" ? sortedImages[sortedImages.length - 1] : sortedImages[0];

  return {
    post,
    count: sortedImages.length,
  };
};

module.exports.deletePost = async (id, taken_at_timestamp) => {
  const params = {
    TableName: "instagram_processed",
    Key: {
      id,
      taken_at_timestamp,
    },
  };

  return documentClient.delete(params).promise();
};
