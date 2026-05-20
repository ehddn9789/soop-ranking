<script>
const rankingList = document.getElementById("rankingList");
const searchInput = document.getElementById("searchInput");
const updateInfo = document.getElementById("updateInfo");

const rankingTab = document.getElementById("rankingTab");
const freepassTab = document.getElementById("freepassTab");
const cutlinePanel = document.getElementById("cutlinePanel");
const rankingBox = document.querySelector(".ranking-box");

let rankingData = [];
let currentView = "ranking";
let previousStateMap = new Map();

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

function setRankingTab() {
    currentView = "ranking";

    if (rankingTab && freepassTab) {
        rankingTab.classList.add("active-tab");
        freepassTab.classList.remove("active-tab");
    }
}

function setFreepassTab() {
    currentView = "freepass";

    if (rankingTab && freepassTab) {
        freepassTab.classList.add("active-tab");
        rankingTab.classList.remove("active-tab");
    }
}

if (rankingTab && freepassTab) {
    rankingTab.addEventListener("click", () => {
        setRankingTab();
        renderRanking();
    });

    freepassTab.addEventListener("click", () => {
        setFreepassTab();
        renderRanking();
    });
}

if (cutlinePanel) {
    cutlinePanel.addEventListener("click", () => {
        setRankingTab();

        searchInput.value = "";

        renderRanking();

        setTimeout(() => {
            scrollToCutline();
        }, 100);
    });
}

function scrollToCutline() {
    const target =
        document.querySelector(".cutline-safe-card") ||
        document.querySelector(".cutline-danger-card");

    if (!target) {
        alert("아직 111등/112등 컷라인이 형성되지 않았습니다.");
        return;
    }

    if (rankingBox) {
        const targetOffset =
            target.offsetTop -
            rankingBox.offsetTop -
            rankingBox.clientHeight / 2 +
            target.clientHeight / 2;

        rankingBox.scrollTo({
            top: targetOffset,
            behavior: "smooth"
        });

        target.classList.add("cutline-flash");

        setTimeout(() => {
            target.classList.remove("cutline-flash");
        }, 1800);

        return;
    }

    target.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

async function loadRanking() {

    try {

        const res =
            await fetch("/api/ranking");

        if (!res.ok) {

            throw new Error("API 응답 실패");
        }

        const newData =
            await res.json();

        rankingData = newData.map((user, index) => {

            const key =

                String(
                    user.commentNo
                    ||
                    user.userId
                    ||
                    user.nickname
                );

            const prev =
                previousStateMap.get(key);

            let upDiff = 0;

            let rankMove = "same";

            let rankMoveCount = 0;

            if (prev) {

                upDiff =

                    Number(user.up || 0)

                    -

                    Number(prev.up || 0);

                if (user.rank < prev.rank) {

                    rankMove = "up";

                    rankMoveCount =
                        prev.rank - user.rank;
                }

                else if (user.rank > prev.rank) {

                    rankMove = "down";

                    rankMoveCount =
                        user.rank - prev.rank;
                }
            }

            return {

                ...user,

                upDiff,

                rankMove,

                rankMoveCount
            };
        });

        previousStateMap.clear();

        rankingData.forEach(user => {

            const key =

                String(
                    user.commentNo
                    ||
                    user.userId
                    ||
                    user.nickname
                );

            previousStateMap.set(key, {

                up: user.up,

                rank: user.rank
            });
        });

        renderRanking();

    }

    catch (err) {

        console.error(err);

        updateInfo.innerText =
            "실시간 랭킹을 불러오지 못했습니다.";
    }
}

function renderRanking() {
    const oldPositions = new Map();

    document.querySelectorAll(".rank-card").forEach(card => {
        oldPositions.set(
            card.dataset.key,
            card.getBoundingClientRect()
        );
    });

    rankingList.innerHTML = "";

    const keyword = searchInput.value.toLowerCase();

    const freepassUsers = rankingData.filter(user =>
        FREE_PASS_USERS.includes(String(user.userId || "").toLowerCase())
    );

    const normalUsers = rankingData.filter(user =>
        !FREE_PASS_USERS.includes(String(user.userId || "").toLowerCase())
    );

    const targetUsers =
        currentView === "freepass"
            ? freepassUsers
            : normalUsers;

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

        if (user.rankMove === "up") {
            topClass += " rank-swap-up";
        }

        if (user.rankMove === "down") {
            topClass += " rank-swap-down";
        }

        card.className = `rank-card ${topClass}`;

        const cardKey =

            String(
                user.commentNo
                ||
                user.userId
                ||
                user.nickname
            );

        card.dataset.key = cardKey;

        let movementText = "─ 유지";

        if (user.movement === "up") {
            movementText = `▲ ${user.rankDiff}계단 상승`;
        }

        if (user.movement === "down") {
            movementText = `▼ ${user.rankDiff}계단 하락`;
        }

        let likeDiffText = "";

        if (user.upDiff > 0) {
            likeDiffText = `<div class="like-diff up-plus">+${user.upDiff} UP 증가</div>`;
        }

        if (user.upDiff < 0) {
            likeDiffText = `<div class="like-diff up-minus">${user.upDiff} UP 감소</div>`;
        }

        let statusText = "";

        if (
            currentView === "ranking" &&
            user.displayRank === CUTLINE_RANK
        ) {
            statusText =
                `<div class="user-id">🟡 생존권 마지막 자리</div>`;
        }

        if (
            currentView === "ranking" &&
            user.displayRank === CUTLINE_RANK + 1
        ) {
            statusText =
                `<div class="user-id">⚪ 탈락권 첫 번째</div>`;
        }

        card.innerHTML = `
            <div class="rank-left">
                <div class="rank-number">
                    ${user.displayRank}
                </div>

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

        const oldRect = oldPositions.get(card.dataset.key);

        if (oldRect) {
            const newRect = card.getBoundingClientRect();

            const deltaY = oldRect.top - newRect.top;

            if (deltaY !== 0) {
                card.style.transform = `translateY(${deltaY}px)`;
                card.style.transition = "transform 0s";

                requestAnimationFrame(() => {
                    card.style.transform = "";
                    card.style.transition = "transform 0.8s ease";
                });
            }
        }

        if (user.rankMove === "up") {
            card.classList.add("rank-swap-up");
        }

        if (user.rankMove === "down") {
            card.classList.add("rank-swap-down");
        }
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