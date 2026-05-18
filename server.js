const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const BJ_ID = "chaenna02";
const POST_ID = "196058089";
const POST_URL = `https://www.sooplive.com/station/${BJ_ID}/post/${POST_ID}`;

let previousRanks = {};
let previousLikes = {};

let cachedRanking = [];
let cachedAt = 0;
let isFetching = false;

const CACHE_TIME = 10000; // 10초 캐싱

async function fetchRankingFromSoop() {
  const firstUrl =
    `https://api-channel.sooplive.com/v1.1/channel/${BJ_ID}/post/${POST_ID}/comment?page=1&perPage=30`;

  const firstResponse = await axios.get(firstUrl);

  const lastPage = firstResponse.data.meta.lastPage;
  let allComments = [...firstResponse.data.data];

  for (let page = 2; page <= lastPage; page++) {
    const url =
      `https://api-channel.sooplive.com/v1.1/channel/${BJ_ID}/post/${POST_ID}/comment?page=${page}&perPage=30`;

    const response = await axios.get(url);
    allComments.push(...response.data.data);
  }

  allComments.sort((a, b) => b.likeCnt - a.likeCnt);

  const ranking = allComments.map((item, index) => {
    const key = String(item.pCommentNo);

    const newRank = index + 1;
    const oldRank = previousRanks[key] || newRank;
    const rankDiff = oldRank - newRank;

    let movement = "same";

    if (rankDiff > 0) {
      movement = "up";
    } else if (rankDiff < 0) {
      movement = "down";
    }

    const oldLike = previousLikes[key] ?? item.likeCnt;
    const likeDiff = item.likeCnt - oldLike;

    previousRanks[key] = newRank;
    previousLikes[key] = item.likeCnt;

    return {
      rank: newRank,
      nickname: item.userNick,
      userId: item.userId,
      profileImage: item.profileImage || "",
      up: item.likeCnt,
      likeDiff: likeDiff,
      rankDiff: Math.abs(rankDiff),
      movement: movement,
      comment: item.comment,
      commentNo: item.pCommentNo,
      link: `${POST_URL}#comment_noti${item.pCommentNo}`
    };
  });

  return ranking;
}

app.get("/api/ranking", async (req, res) => {
  try {
    const now = Date.now();

    if (cachedRanking.length > 0 && now - cachedAt < CACHE_TIME) {
      return res.json(cachedRanking);
    }

    if (isFetching) {
      return res.json(cachedRanking);
    }

    isFetching = true;

    const ranking = await fetchRankingFromSoop();

    cachedRanking = ranking;
    cachedAt = Date.now();
    isFetching = false;

    res.json(cachedRanking);

  } catch (error) {
    isFetching = false;

    console.error(error.message);

    if (cachedRanking.length > 0) {
      return res.json(cachedRanking);
    }

    res.status(500).json({
      error: "SOOP 댓글 데이터를 불러오지 못했습니다."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});