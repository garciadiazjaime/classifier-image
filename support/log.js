const { Logtail } = require("@logtail/node");

require("dotenv").config();

module.exports.loggerInfo = async function (msg) {
  console.log(msg);

  const logtail = new Logtail(process.env.LOGTAIL_TOKEN);
  await logtail.info(msg);
  await logtail.flush();
};
