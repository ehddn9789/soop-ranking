<script>
const rankingList = document.getElementById("rankingList");
const searchInput = document.getElementById("searchInput");
const updateInfo = document.getElementById("updateInfo");
const rankingTab = document.getElementById("rankingTab");
const freepassTab = document.getElementById("freepassTab");

let rankingData = [];
let currentView = "ranking";

const CUTLINE_RANK = 111;

const FREE_PASS_USERS = [
    "ldrboo",
    "khm11903",
    "qn308dud",
    "iamquaddurup",
    "dlghfjs",
    "jrdart",
    "roket0829",
    "whatcherry4",
    "chaenna02",
    "singgyul",
    "kymakyma"
];

if (rankingTab && freepassTab) {
    rankingTab.addEventListener("click", () => {
        currentView = "ranking";
        rankingTab.classList.add("active-tab");
        freepassTab.classList.remove("active-tab");
        renderRanking();
    });

    freepassTab.addEventListener("click", () => {
        currentView = "freepass";
        freepassTab.classList.add("active-tab");
        rankingTab.classList.remove("active-tab");
        renderRanking();
    });
}

async function loadRanking() {
    try {
        const res = await fetch("/api/ranking");

        if (!res.ok) {
            throw new Error("API 응답 실패");
        }

        rankingData = await res.json();
        renderRanking();

    } catch (err) {
        console.error(err);
        updateInfo.innerText = "실시간 랭킹을 불러오지 못했습니다.";
    }
}

function renderRanking() {
    rankingList.innerHTML = "";

    const keyword = searchInput.value.toLowerCase();

    const freepassUsers = rankingData.filter(user =>
        FREE_PASS_USERS.includes(String(user.userId || "").toLowerCase())
    );

    const normalUsers = rankingData.filter(user =>
        !FREE_PASS_USERS.includes(String(user.userId || "").toLowerCase())
    );

    const targetUsers =
        currentView === "freepass" ? freepassUsers : normalUsers;

    const reRankedUsers = targetUsers.map((user, index) => ({
        ...user,
        displayRank: index + 1
    }));

    const filtered = reRankedUsers.filter(user =>
        String(user.nickname || "").toLowerCase().includes(keyword) ||
        String(user.userId || "").toLowerCase().includes(keyword)
    );

    updateInfo.innerText =
        currentView === "freepass"
            ? `프리패스 인원 ${freepassUsers.length}명 | 마지막 업데이트: ${new Date().toLocaleString("ko-KR")}`
            : `총 ${rankingData.length}개 댓글 | 랭킹 반영 ${normalUsers.length}명 | 프리패스 ${freepassUsers.length}명 제외 | 마지막 업데이트: ${new Date().toLocaleString("ko-KR")}`;

    if (filtered.length === 0) {
        rankingList.innerHTML =
            `<div class="empty">${
                currentView === "freepass"
                    ? "프리패스 신청자가 없습니다."
                    : "검색 결과가 없습니다."
            }</div>`;
        return;
    }

    filtered.forEach(user => {
        if (
            currentView === "ranking" &&
            user.displayRank === CUTLINE_RANK + 1
        ) {
            const divider = document.createElement("div");
            divider.className = "cutline-divider";
            divider.innerText = "🔥 생존 마감선 — 111위까지 선정 🔥";
            rankingList.appendChild(divider);
        }

        const card = document.createElement("div");

        let topClass = "";

        if (user.displayRank === 1) topClass += " top1";
        if (user.displayRank === 2) topClass += " top2";
        if (user.displayRank === 3) topClass += " top3";

        if (currentView === "ranking") {
            if (user.displayRank === CUTLINE_RANK) {
                topClass += " cutline-safe-card";
            }

            if (user.displayRank === CUTLINE_RANK + 1) {
                topClass += " cutline-danger-card";
            }

            if (
                user.displayRank >= CUTLINE_RANK - 3 &&
                user.displayRank <= CUTLINE_RANK + 4
            ) {
                topClass += " cutline-zone";
            }
        }

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

        let statusText = "";

        if (
            currentView === "ranking" &&
            user.displayRank === CUTLINE_RANK
        ) {
            statusText = `<div class="user-id">🟡 생존권 마지막 자리</div>`;
        }

        if (
            currentView === "ranking" &&
            user.displayRank === CUTLINE_RANK + 1
        ) {
            statusText = `<div class="user-id">⚪ 탈락권 첫 번째</div>`;
        }

        card.innerHTML = `
            <div class="rank-left">
                <div class="rank-number">${user.displayRank}</div>

                <img
                    class="profile-image"
                    src="${user.profileImage || ""}"
                    alt=""
                    onerror="this.style.display='none'"
                >

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

                    ${statusText}
                    ${likeDiffText}
                </div>
            </div>

            <div class="rank-right">
                <div class="up-count">👍 ${user.up}</div>

                <a href="${user.link}" target="_blank" class="vote-btn">
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