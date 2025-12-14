import { Octokit } from "@octokit/rest";
import fs from "fs";

const octokit = new Octokit({ auth: process.env.MY_GITHUB_TOKEN });

// cores
const languageColors = {
  "Java": "#b07219",
  "Vue": "#41b883",
  "JavaScript": "#f1e05a",
  "TypeScript": "#2b7489",
  "HTML": "#e34c26",
  "CSS": "#563d7c",
  "C": "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  "Python": "#3572A5",
  "SQL": "#e38c00",
  "Shell": "#89e051",
  "PHP": "#4F5D95",
  "Ruby": "#701516",
  "Go": "#00ADD8",
  "Swift": "#F05138",
  "Kotlin": "#A97BFF",
  "Rust": "#dea584"
};

async function main() {
  const username = "TaylanHahn";
  const languagesMap = {};

  try {
    // 1. busca os repos
    const { data: repos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      type: "owner",
    });

    // 2. itera e soma as linguagens
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

    // 3. calculo de % e ordenar
    const totalBytes = Object.values(languagesMap).reduce((a, b) => a + b, 0);
    const stats = Object.entries(languagesMap)
      .map(([lang, bytes]) => ({
        lang,
        percent: (bytes / totalBytes) * 100,
        percentStr: ((bytes / totalBytes) * 100).toFixed(2)
      }))
      .filter(item => item.percent > 0.5) 
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 8);

    // 4. Gerar SVG 
    const chartWidth = 350;
    const barHeight = 12;
    const startX = 25;
    const barY = 60;

    const legendRows = Math.ceil(stats.length / 2);
    const totalSvgHeight = barY + barHeight + (legendRows * 25) + 40;

    let currentX = startX;

    // a. barra única
    const barsHtml = stats.map(item => {
      const segmentWidth = (item.percent / 100) * chartWidth;
      const color = languageColors[item.lang] || "#8b5cf6";
      
      const rect = `<rect x="${currentX}" y="${barY}" width="${segmentWidth}" height="${barHeight}" fill="${color}" />`;
      
      currentX += segmentWidth; 
      return rect;
    }).join('');

    // b. legenda em duas colunas
    const legendHtml = stats.map((item, index) => {
      const color = languageColors[item.lang] || "#8b5cf6";
      const colX = index % 2 === 0 ? startX : startX + (chartWidth / 2) + 20;
      const rowY = barY + 35 + (Math.floor(index / 2) * 25);

      return `
        <g>
          <circle cx="${colX + 5}" cy="${rowY - 5}" r="5" fill="${color}" />
          <text x="${colX + 15}" y="${rowY}" class="text">
            ${item.lang} <tspan class="percent" dx="5">${item.percentStr}%</tspan>
          </text>
        </g>
      `;
    }).join('');

    // c. SVG final
    const svgContent = `
      <svg width="400" height="${totalSvgHeight}" viewBox="0 0 400 ${totalSvgHeight}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .bg { fill: #000000; }
          .title { font-family: 'Segoe UI', Ubuntu, Sans-Serif; fill: #a78bfa; font-size: 18px; font-weight: bold; }
          .text { font-family: 'Segoe UI', Ubuntu, Sans-Serif; fill: #e2e8f0; font-size: 13px; font-weight: 600; }
          .percent { fill: #94a3b8; font-weight: 400; }
          .bar-container { clip-path: url(#roundedCorners); }
        </style>
        
        <rect width="100%" height="100%" rx="12" class="bg" stroke="#3b3b58" stroke-width="1" />
        
        <text x="${startX}" y="35" class="title">Most Used Languages</text>
        
        <defs>
          <clipPath id="roundedCorners">
            <rect x="${startX}" y="${barY}" width="${chartWidth}" height="${barHeight}" rx="${barHeight / 2}" />
          </clipPath>
        </defs>

        <rect x="${startX}" y="${barY}" width="${chartWidth}" height="${barHeight}" rx="${barHeight / 2}" fill="#2d2b55" />

        <g class="bar-container">
          ${barsHtml}
        </g>
        
        ${legendHtml}
      </svg>
    `;

    fs.writeFileSync("stats.svg", svgContent);
    console.log("SVG Stacked Bar gerado com sucesso!");

  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

main();
