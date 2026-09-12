#!/usr/bin/env node
// 배포 전 최소 검증: JSON 설정 파일들이 파싱되는지, www/index.html 안의 인라인 스크립트에
// 문법 오류가 없는지 확인한다. 게임을 실제로 실행하지는 않고 정적으로만 검사한다.
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let hasError = false;

function fail(message) {
  console.error("FAIL:", message);
  hasError = true;
}

function ok(message) {
  console.log("OK:", message);
}

// 1) 핵심 JSON 설정 파일이 유효한 JSON인지 확인
["package.json", "capacitor.config.json", "www/manifest.json"].forEach(function (relPath) {
  var filePath = path.join(ROOT, relPath);
  try {
    JSON.parse(fs.readFileSync(filePath, "utf8"));
    ok(relPath + " is valid JSON");
  } catch (e) {
    fail(relPath + " failed to parse: " + e.message);
  }
});

// 2) www/index.html 안의 인라인 <script>에 문법 오류가 없는지 확인(실행은 하지 않음)
var indexPath = path.join(ROOT, "www", "index.html");
try {
  var html = fs.readFileSync(indexPath, "utf8");
  var match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) {
    fail("www/index.html: no inline <script> block found");
  } else {
    // new Function()은 코드를 파싱/컴파일만 하고 실행하지는 않으므로,
    // DOM이 없는 CI 환경에서도 안전하게 문법만 검사할 수 있다.
    new Function(match[1]);
    ok("www/index.html inline script has valid JavaScript syntax");
  }
} catch (e) {
  fail("www/index.html inline script syntax error: " + e.message);
}

if (hasError) {
  console.error("\nValidation failed.");
  process.exit(1);
}
console.log("\nAll checks passed.");
