<script>
const rankingList = document.getElementById("rankingList");
const searchInput = document.getElementById("searchInput");
const updateInfo = document.getElementById("updateInfo");

let rankingData = [];

async function loadRanking() {
    try {
        const res = await fetch("/api/ranking");

        if (!res.ok) {
            throw new Error("API 응답 실패");
        }

        rankingData = await res.json();

        updateInfo.innerText =
            `총 ${rankingData.length}개 댓글 | 마지막 업데이트: ${new Date().toLocaleString("ko-KR")}`;

        renderRanking();

    } catch (err) {
        console.error(err);
        updateInfo.innerText = "실시간 랭킹을 불러오지 못했습니다.";
    }
}

function renderRanking() {
    rankingList.innerHTML = "";

    const keyword = searchInput.value.toLowerCase();

    const filtered = rankingData.filter(user =>
        String(user.nickname || "").toLowerCase().includes(keyword) ||
        String(user.userId || "").toLowerCase().includes(keyword)
    );

    if (filtered.length === 0) {
        rankingList.innerHTML =
            `<div class="empty">검색 결과가 없습니다.</div>`;
        return;
    }

    filtered.forEach(user => {
        const card = document.createElement("div");

        let topClass = "";

        if (user.rank === 1) topClass = "top1";
        if (user.rank === 2) topClass = "top2";
        if (user.rank === 3) topClass = "top3";

        card.className = `rank-card ${topClass}`;

        let movementText = "─ 유지";

        if (user.movement === "up") {
            movementText = `▲ ${user.rankDiff}계단 상승`;
        }

        if (user.movement === "down") {
            movementText = `▼ ${user.rankDiff}계단 하락`;
        }

        let likeDiffText = "";

        if (user.likeDiff > 0) {
            likeDiffText = `<div class="user-id">+${user.likeDiff} UP 증가</div>`;
        }

        card.innerHTML = `
            <div class="rank-left">
                <div class="rank-number">${user.rank}</div>
                <img
                    class="profile-image"
                    src="${user.profileImage}"
                    alt=""
                ></img>

                <div>
                    <div class="nickname">
                        ${escapeHtml(user.nickname)}
                    </div>

                    <div class="user-id">
                        @${escapeHtml(user.userId)}
                    </div>

                    <div class="movement ${user.movement}">
                        ${movementText}
                    </div>

                    ${likeDiffText}
                </div>
            </div>

            <div class="rank-right">
                <div class="up-count">
                    👍 ${user.up}
                </div>

                <a
                    href="${user.link}"
                    target="_blank"
                    class="vote-btn"
                >
                    원본 보기
                </a>
            </div>
        `;

        rankingList.appendChild(card);
    });
}

function escapeHtml(text) {
    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", renderRanking);

loadRanking();
setInterval(loadRanking, 10000);
</script>