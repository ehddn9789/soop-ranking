const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

const BJ_ID = "chaenna02";
const POST_ID = "196058089";

app.get("/api/comments", async (req, res) => {
  try {

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

    res.json({
      total: allComments.length,
      updatedAt: new Date().toLocaleString("ko-KR"),
      comments: allComments,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "데이터 불러오기 실패",
    });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행 중`);
  console.log(`http://localhost:${PORT}`);
});