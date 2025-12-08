import { Octokit } from "@octokit/rest"; // Mudou de require para import
import fs from "fs"; // Mudou de require para import

// O token é injetado pelo GitHub Actions
const octokit = new Octokit({ auth: process.env.MY_GITHUB_TOKEN });

const languageColors = {
  "Java": "#b07219",
  "Vue": "#41b883",
  "JavaScript": "#f1e05a",
  "HTML": "#e34c26",
  "CSS": "#563d7c",
  "C": "#555555",
  "C++": "#f34b7d",
  "Python": "#3572A5",
  "TypeScript": "#2b7489",
  "SQL": "#e38c00",
  "Shell": "#89e051"
};

async function main() {
  const username = "TaylanHahn"; 
  const languagesMap = {};

  try {
    // 1. Buscar repositórios
    const { data: repos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      type: "owner",
    });

    // 2. Iterar e somar linguagens
    for (const repo of repos) {
      if (repo.fork) continue;

      const { data: langs } = await octokit.repos.listLanguages({
        owner: username,
        repo: repo.name,
      });

      for (const [lang, bytes] of Object.entries(langs)) {
        languagesMap[lang] = (languagesMap[lang] || 0) + bytes;
      }
    }

    // 3. Calcular porcentagens
    const totalBytes = Object.values(languagesMap).reduce((a, b) => a + b, 0);
    const stats = Object.entries(languagesMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([lang, bytes]) => ({
        lang,
        percent: ((bytes / totalBytes) * 100).toFixed(1),
      }));

    // 4. Gerar SVG
    const height = stats.length * 40 + 60; 
    
    const svgContent = `
      <svg width="350" height="${height}" viewBox="0 0 350 ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .bg { fill: #130f1c; }
          .title { font-family: 'Segoe UI', Ubuntu, Sans-Serif; fill: #a78bfa; font-size: 18px; font-weight: bold; }
          .text { font-family: 'Segoe UI', Ubuntu, Sans-Serif; fill: #e2e8f0; font-size: 14px; font-weight: 500; }
          .percent { font-family: 'Segoe UI', Ubuntu, Sans-Serif; fill: #94a3b8; font-size: 12px; }
          .bar-bg { fill: #2d2b55; rx: 5; }
          .bar-fill { rx: 5; }
        </style>
        <rect width="100%" height="100%" rx="10" class="bg" stroke="#3b3b58" stroke-width="1" />
        <text x="25" y="35" class="title">Top Languages</text>
        ${stats.map((item, index) => {
          const y = 70 + index * 40;
          const width = Math.max(item.percent * 2, 10);
          const color = languageColors[item.lang] || "#8b5cf6"; 
          return `
            <text x="25" y="${y - 12}" class="text">${item.lang}</text>
            <rect x="25" y="${y - 5}" width="250" height="8" class="bar-bg" />
            <rect x="25" y="${y - 5}" width="${width * 2.5}" height="8" class="bar-fill" fill="${color}" />
            <text x="${30 + (width * 2.5)}" y="${y + 3}" class="percent">${item.percent}%</text>
          `;
        }).join('')}
      </svg>
    `;

    fs.writeFileSync("stats.svg", svgContent);
    console.log("SVG gerado com sucesso!");

  } catch (error) {
    console.error("Erro ao gerar stats:", error);
    process.exit(1); 
  }
}

main();