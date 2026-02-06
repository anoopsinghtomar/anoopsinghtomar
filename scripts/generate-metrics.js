import fs from "fs";

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;

const query = `
query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, isFork: false) {
      totalCount
      nodes {
        stargazerCount
        primaryLanguage {
          name
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
    }
  }
}
`;

async function run() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { login: username },
    }),
  });

  const json = await res.json();
  const user = json.data.user;

  const stars = user.repositories.nodes.reduce(
    (sum, r) => sum + r.stargazerCount,
    0
  );

  const languages = {};
  for (const repo of user.repositories.nodes) {
    const lang = repo.primaryLanguage?.name;
    if (lang) languages[lang] = (languages[lang] || 0) + 1;
  }

  const svg = `
<svg width="420" height="200" xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: Arial, sans-serif; fill: #333 }
    .title { font-size: 18px; font-weight: bold }
    .stat { font-size: 14px }
  </style>

  <rect width="100%" height="100%" rx="12" fill="#f6f8fa"/>

  <text x="20" y="30" class="title">${username}'s GitHub Stats</text>

  <text x="20" y="60" class="stat">⭐ Stars: ${stars}</text>
  <text x="20" y="80" class="stat">🧑‍💻 Commits: ${user.contributionsCollection.totalCommitContributions}</text>
  <text x="20" y="100" class="stat">🔀 PRs: ${user.contributionsCollection.totalPullRequestContributions}</text>
  <text x="20" y="120" class="stat">🐞 Issues: ${user.contributionsCollection.totalIssueContributions}</text>

  <text x="20" y="150" class="stat">💬 Top Languages:</text>
  ${
    Object.entries(languages)
      .slice(0, 4)
      .map(
        ([lang, count], i) =>
          `<text x="40" y="${170 + i * 16}" class="stat">${lang}: ${count}</text>`
      )
      .join("")
  }
</svg>
`;

  fs.writeFileSync("assets/metrics.svg", svg.trim());
}

run().catch(console.error);
