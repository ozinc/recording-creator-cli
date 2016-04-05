'use strict';

const minimist = require('minimist')
const bluebird = require('bluebird');
const request = require('request');
const _ = require('lodash');
const moment = require('moment');
const co = require('co');

// parse arguments
var argv = minimist(process.argv.slice(2));
if (!_.every(['token', 'channel', 'title', 'in', 'out'], _.partial(_.has, argv))) {
  console.error('usage: node create-recording.js <args>');
  console.error();
  console.error('args (required):');
  console.error('  token=<token>');
  console.error('  channel=<channel slug>   ex: stod2');
  console.error('  title="<title>"          ex: "The Simpsons"');
  console.error('  in=<in timestamp>        ex: "2016-04-05 19:25:25"');
  console.error('  out=<out timestamp>      ex: "2016-04-05 19:30:25"');
  process.exit(1);
}

let coreClient = bluebird.promisifyAll(request.defaults({
  baseUrl: 'https://core.oz.com/',
  json: true,
  headers: {
    authorization: 'Bearer ' + argv.token
  }
}));

function* slugToId (slug) {
  let res = yield coreClient.getAsync({
    url: '/channels/?slug=' + slug
  });
  if (res.statusCode !== 200) {
    throw new Error('unable to map slug: ' + JSON.stringify(res.body));
  } else if (res.body.data.length === 0) {
    throw new Error('invalid channel: ' + slug);
  }
  let channelId = _.first(res.body.data).id;
  console.log(`(1) mapping ${slug} to channelId: ${channelId}`);
  return channelId;
}

function* createVideo (slug, channelId, title) {
  const video = {
    sourceType: 'stream',
    contentType: 'movie',
    title,
    published: true,
    playbackCountries: ['IS'],
    // TODO: Add playableUntil
  }
  let res = yield coreClient.postAsync({
    url: `/channels/${channelId}/videos`,
    body: video
  });
  if (res.statusCode !== 201) {
    throw new Error('unable to create video: ' + JSON.stringify(res.body));
  }
  let videoId = res.body.data.id;
  console.log(`(2) video created, go edit the metadata here: https://creator.oz.com/${slug}/video/${videoId}`);
  return videoId;
}

function* createSlot (channelId, videoId, inTime, outTime) {
  const slot = {
    channelId,
    videoId,
    type: 'regular',
    startTime: inTime,
    metadata: {
      started: inTime,
      ended: outTime
    }
  };
  let res = yield coreClient.postAsync({
    url: `/channels/${channelId}/slots?vodify=true`,
    body: slot
  });
  let slotId = res.body.data.id;
  if (res.statusCode !== 201) {
    throw new Error('unable to create slot: ' + JSON.stringify(res.body));
  }
  console.log(`(3) recording created (id: ${slotId}), done!`);
  return slotId;
}

// main:
co(function* () {
  try {
    let channelId = yield slugToId(argv.channel);
    let videoId = yield createVideo(argv.channel, channelId, argv.title);
    let slotId = yield createSlot(channelId, videoId, argv.in, argv.out);
  } catch (err) {
    console.error('Error hit when creating the recording!');
    console.error(err);
    // for debugging purposes:
    // console.error(err.stack);
  }
});
