# AI 프롬프트 설계 문서 (AI Prompt Design)

- 문서 버전: 1.1.0
- 최종 수정일:
- 대상: 실제로 LLM(Gemini)을 호출하는 두 기능 — **AI 운항 리포트(재분석)**, **물류 일정관리(AI 문서 자동 등록)**
- 목적: 두 기능의 프롬프트 설계·요청 컨텍스트 구성·구조화 출력 스키마·서버 후처리 로직을 실제 소스 그대로 기록하고,
  현재 사용 중인 모델(재분석: Gemini 2.5 Pro / PDF 파싱: Gemini 2.5 Flash)의 장단점과 대안 모델을 정리한다.

---

## 1. 개요

이 프로젝트에서 사용자 요청에 따라 실시간으로 LLM을 호출하는 지점은 API 라우트 2곳뿐이다.

| 기능 | 화면 | 엔드포인트 | 트리거 |
| --- | --- | --- | --- |
| AI 운항 리포트 재분석 | AI 운항 리포트 (`/ai-report`) | `POST /api/ai-report/reanalyze` | 카드별 "재분석" 버튼, 헤더 "전체 재분석" 버튼 |
| AI 문서 자동 등록 | 물류 일정관리 (`/schedule`) 항차 등록 모달 | `POST /api/voyages/parse-pdf` | PDF 업로드/드래그앤드롭 |

두 기능 모두 같은 아키텍처 패턴을 따른다.

```
[클라이언트] 화면에 이미 있는 데이터로 요청 컨텍스트 조립
      ↓ fetch (JSON, 60초 타임아웃)
[서버 API 라우트] 프롬프트 생성 → Gemini 호출(구조화 출력 강제) → 응답 검증·보정
      ↓
[클라이언트] 성공 시 화면 반영 / 실패 시 기존 데이터 유지 + 안내 문구
```

핵심 원칙은 **"LLM 출력을 그대로 신뢰하지 않는다"** 이다. 두 라우트 모두 응답을 파싱한 뒤 타입·범위·화이트리스트를
검증하고, 이 프로젝트의 도메인 불변식(예: "권장 속도는 항상 마감을 지킬 수 있어야 한다")을 서버 코드가 최종적으로
강제한다. 모델이 실수해도 화면에 논리적으로 잘못된 값이 노출되지 않도록 설계했다.

---

## 2. 공통 기술 스택

- **SDK**: [`@google/genai`](https://www.npmjs.com/package/@google/genai) (`^2.15.0`)
- **인증 방식 2가지** (SDK가 환경변수를 직접 읽어 동작 모드를 자체 결정 — 코드는 필수값이 채워졌는지만 사전 확인):
  | 방식 | 필요 환경변수 | 용도 |
  | --- | --- | --- |
  | Gemini API (단일 키) | `GEMINI_API_KEY` (또는 `GOOGLE_API_KEY`) | 로컬 개발, 간단한 배포 |
  | Vertex AI (서비스 계정/ADC) | `GOOGLE_GENAI_USE_VERTEXAI=true`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` | GCP 프로덕션(Cloud Run) — 이 프로젝트의 실제 배포 방식 |
- **모델**: `process.env.GEMINI_MODEL || {라우트별 기본값}` — 두 라우트가 **서로 다른 기본값**을 쓴다(6장 참고).
  `GEMINI_MODEL`을 설정하면 두 라우트 모두 그 값으로 강제 override된다(공용 환경변수 하나로 전체를 한 모델로
  통일하고 싶을 때 사용).
  | 라우트 | 기본 모델 | 선택 이유 |
  | --- | --- | --- |
  | `/api/ai-report/reanalyze` | `gemini-2.5-pro` | 서술 품질(5~8포인트 종합 분석, 리스크별 상세 설명)이 중요 |
  | `/api/voyages/parse-pdf` | `gemini-2.5-flash` | 단순 필드 추출 위주라 지연시간이 더 중요 |
- **구조화 출력 강제**: `config.responseMimeType: 'application/json'` + `config.responseSchema`(`Type.OBJECT/STRING/NUMBER/BOOLEAN/ARRAY`, `enum`)로 Gemini가 반드시 지정된 JSON 스키마로만 응답하도록 강제. 자유 텍스트 파싱·정규식 추출이 필요 없어 파싱 실패율이 낮다.
- **실패 사유 공통 규약**: `no_api_key`(설정 안 됨) · `bad_request`(요청 형식 오류) · `upstream_error`(Gemini 호출/파싱 실패) — 모두 HTTP 200으로 반환하고 `{ ok: false, reason }` 형태로 클라이언트가 구분해 안내 문구를 고른다. (`no_api_key`는 "설정 문제"이지 "장애"가 아니므로 4xx/5xx가 아닌 200으로 정상 응답 처리)

---

## 3. AI 운항 리포트 — 재분석(Reanalyze) 프롬프트

### 3.1 요청 컨텍스트 구성

클라이언트(`features/ai-report/page.tsx`)가 화면에 이미 계산·조회해 둔 값들을 그대로 모아 보낸다 — 서버가 별도로
DB 재조회를 하지 않는다(단, 실시간 기상은 서버가 Open-Meteo를 한 번 더 직접 호출한다 — Gemini 키가 서버 전용이라
프롬프트 조립도 서버에서 마무리해야 하기 때문).

`AiReanalyzeRequest` 주요 필드 (`features/ai-report/aiReanalysis.ts`):

| 필드 | 설명 |
| --- | --- |
| `vessel` | 이름·타입·IMO |
| `route` | 출발/도착항, 화물 설명 |
| `deadlineTerm` / `deadlineAt` | RTA 또는 STA(미확정 시) 및 그 시각 |
| `nowIso` / `baselineEtaAt` | 계산 기준 "지금"과 baseline (속도, 도착시각) 앵커 |
| `progress` | 총/기운항/잔여 거리, 진행률 |
| `currentSpeedKnots`, `currentSpeedProbabilityPercent`, `marginHoursAtCurrentSpeed` | 현재 속도와 그 속도로의 마감 준수 확률·여유시간 |
| `planSpeedKnots`, `baselineRecommendedSpeedKnots` | 원 계획 속도, 규칙 기반 baseline 권장 속도 |
| `speedRangeKnots`, `fuelCurve` | 선박이 낼 수 있는 속도 범위와 속도별 연료 소모 커브 |
| `congestion` | 도착항 혼잡도(등급·점수·평균 대기·접안 가능 선석·추세) |
| `nearbyIssues` | 남은 항로 인근 지역 이슈 |
| `lang` | 응답 언어(ko/en) |

서버는 여기에 더해 **현재 위치·도착항의 실시간 풍속/파고**(Open-Meteo)와, 클라이언트와 **완전히 동일한 공식**
(`computeRequiredSpeedKnots`)으로 계산한 **"필요 평균 속도"**를 프롬프트에 주입한다. 같은 공식을 서버에도
그대로 구현해 둔 이유는, Gemini에게 주는 근거 수치와 화면에 나중에 표시되는 수치가 항상 일치해야 하기 때문이다.

### 3.2 프롬프트 템플릿

실제 프롬프트(`src/app/api/ai-report/reanalyze/route.ts`의 `buildPrompt`)를 그대로 옮긴 것이다. `${...}` 부분이
요청 컨텍스트로 채워지는 변수다.

```
You are a maritime voyage-optimization analyst for a shipping line. Given the following REAL-TIME voyage
data, recommend an optimal speed and produce a concise, grounded operational analysis. Only reference facts
given below -- do not invent vessel incidents, ports, or figures not present here. Treat the numbers below
(especially the required-speed constraint) as ground truth -- do not recompute them differently yourself.

Vessel: {vessel.name} ({vessel.type}, IMO {vessel.imo})
Feasible speed range: {min}-{max}kts
Fuel consumption curve (speed -> daily fuel use, lower speed = more efficient): {speed}kts -> {fuel} ton/day, ...
Route: {departurePort} -> {arrivalPort}
Cargo: {cargoDescription}
Original planned speed: {planSpeedKnots}kts
Rule-based baseline recommended speed (for reference only, you may deviate from it as long as you respect
the required-speed constraint below): {baselineRecommendedSpeedKnots}kts
Deadline ({deadlineTerm}): {deadlineAt} ({hoursUntilDeadline}h from now)
Progress: {traveledNm}nm traveled / {remainingNm}nm remaining of {totalNm}nm total ({progressPercent}%)
Current speed: {currentSpeedKnots}kts -- {deadlineTerm} compliance probability at current speed:
{currentSpeedProbabilityPercent}% (margin {marginHoursAtCurrentSpeed}h)
{requiredSpeedNote}
Current position weather: wind {windSpeed|unknown} m/s, wave height {waveHeight|unknown} m
Arrival port weather: wind {windSpeed|unknown} m/s, wave height {waveHeight|unknown} m
Arrival port congestion: {level} (score {score}/100), avg wait {avgWaitHours}h, berths available
{berthsAvailable}/{berthsTotal}, trend {trend}
Regional issues near the remaining route:
{issue 목록, "- [severity] title: description" 형식, 없으면 "(none reported)"}

Recommend a speed (knots, within the feasible range above) that balances:
- Meeting the {deadlineTerm} deadline per the required-speed constraint above (this is a hard floor, not a
  suggestion).
- Above that floor, minimizing fuel burn per the fuel curve -- do not recommend faster than necessary if
  there is schedule slack above the floor, especially if the arrival port is congested (arriving early into
  a congested port wastes fuel for no benefit).
- Weather/sea-state safety -- if wave height is high, mention the tradeoff, but you may still need to stay
  at or above the required-speed floor to meet the deadline.

Write the response in {Korean|English}.
Produce:
1. "recommendedSpeedKnots": the single recommended speed in knots (a number, within the feasible range,
   respecting the required-speed constraint above).
2. "reasoning": a THOROUGH, comprehensive operational analysis (aim for 5-8 distinct points, not a short
   summary) that synthesizes ALL of the following into one cohesive judgment the reader can act on -- do
   not limit this to only the speed rationale:
   - Why this exact speed was chosen relative to the {deadlineTerm} constraint and the schedule
     margin/deficit.
   - The fuel-vs-schedule trade-off implied by the fuel curve (what is gained or given up by not going
     faster/slower).
   - How the CURRENT real-time weather (at the vessel's position) affects the recommendation, if
     wind/wave data is available.
   - How the ARRIVAL PORT weather affects the recommendation, if available.
   - How arrival port congestion (level, average wait, berth availability, trend) factors into the timing
     decision -- explicitly state whether arriving earlier would help or just add unproductive waiting.
   - How each regional issue near the remaining route (if any were listed above) concretely affects this
     voyage's plan -- reference each one that is relevant by name, don't just acknowledge that issues
     exist.
   Explicitly reference the real figures given above throughout -- the speed you state here MUST match
   recommendedSpeedKnots exactly. Put EVERY distinct point on its own line (use \n between points) so the
   reader can scan it like a checklist rather than a wall of text.
3. "risks": 1-4 risk items synthesized strictly from the weather/congestion/regional-issue data above (skip
   categories with nothing to report; never invent unrelated risks). Each item needs a level
   (high/medium/low), a category (weather/port/geopolitical/mechanical), a short title, and a
   "description" of 2-3 detailed sentences (not just one) -- explain both the concrete operational impact
   on THIS voyage and a specific recommended mitigation or watch-item. Put each sentence on its own line
   (use \n between sentences), same as the reasoning field.
```

> **2026-08-10 개정**: 초기 버전은 `reasoning`을 "왜 이 속도인가"만 2~4문장으로 다루고, `risks`의
> `description`도 한 문장으로 제한했다. 사용자 피드백("운항 고려사항·남은 항로 인근 지역 이슈를 최신내용으로
> 종합 분석해서 더 디테일하게, 줄바꿈 처리해서")을 반영해, `reasoning`이 속도 근거뿐 아니라 실시간 기상·도착항
> 혼잡도·인근 지역 이슈까지 명시적으로 모두 짚는 5~8개 포인트짜리 종합 판단 자료가 되도록, `risks.description`도
> 2~3문장으로 확장했다. 두 필드 모두 포인트/문장마다 줄바꿈(`\n`)을 강제하고, 모델이 이를 무시할 경우를 대비한
> `ensureLineBreaks` 방어 처리도 `reasoning`뿐 아니라 각 `risks[].description`에도 동일하게 적용했다
> (`route.ts`의 `risks.map(r => ({ ...r, description: ensureLineBreaks(r.description) }))`). 클라이언트
> 렌더링(`ai-report/page.tsx`)에도 리스크 설명 `<p>`에 `whitespace-pre-line`을 추가해 줄바꿈이 실제로
> 화면에 반영되도록 했다(기존에는 이 클래스가 없어 `\n`이 있어도 한 줄로 붙어 보였다).

`{requiredSpeedNote}`는 두 경우로 분기되어 프롬프트에 삽입된다 — **모델이 산술을 다시 하지 않고, 서버가 이미
계산해 둔 "필요 속도"를 그대로 하한선(hard floor)으로 받아들이도록 강제**하는 것이 핵심이다.

- 마감 불가능(필요 속도 > 최고 가능 속도): "...the deadline cannot be met even at full speed. In this case you
  MUST recommend exactly {max}kts..."
- 가능: "...Your recommendedSpeedKnots MUST be >= {N}kts so the deadline is met with zero or positive
  margin -- never recommend a speed below this, even to save fuel."

### 3.3 응답 스키마 (`responseSchema`)

```json
{
  "type": "OBJECT",
  "properties": {
    "recommendedSpeedKnots": { "type": "NUMBER" },
    "reasoning": { "type": "STRING" },
    "risks": {
      "type": "ARRAY",
      "items": {
        "type": "OBJECT",
        "properties": {
          "level": { "type": "STRING", "enum": ["high", "medium", "low"] },
          "category": { "type": "STRING", "enum": ["weather", "port", "geopolitical", "mechanical"] },
          "title": { "type": "STRING" },
          "description": { "type": "STRING" }
        },
        "required": ["level", "category", "title", "description"]
      }
    }
  },
  "required": ["recommendedSpeedKnots", "reasoning", "risks"]
}
```

### 3.4 서버 후처리 (응답을 받은 뒤 반드시 거치는 보정)

1. **타입 검증**: `recommendedSpeedKnots`가 유한한 숫자인지, `reasoning`이 문자열인지, `risks`가 배열인지 확인 — 아니면 `upstream_error`.
2. **risk 필터링**: `level`/`category`가 허용된 enum이고 `title`/`description`이 문자열인 항목만 최대 6개까지 채택. 유효한 risk가 0개면 실패 처리.
3. **속도 강제 보정(이 기능의 핵심 불변식)** — 모델이 가능 속도 범위를 벗어나거나 마감을 못 지키는 값을 제안해도, 서버가 항상 최종적으로 보정한다:
   ```
   clamped = clamp(gemini의 recommendedSpeedKnots, speedRangeKnots.min, speedRangeKnots.max)
   if requiredSpeedKnots > speedRangeKnots.max:
     최종 속도 = speedRangeKnots.max        # 최고속력이 최선
   else:
     최종 속도 = clamp(round(clamped, 0.1), 하한=requiredSpeedKnots, 상한=speedRangeKnots.max)
   ```
   → "권장 속도로 운항하면 마감 준수 확률은 항상 100%(불가능하면 최고속력)"라는 이 기능 전체의 전제를 모델의 산술 실수와 무관하게 항상 보장한다.
4. **줄바꿈 방어 처리(2단계)**: `normalizeLineBreaks`가 두 가지 실패 모드를 모두 처리한다.
   1. 모델이 실제 개행 대신 리터럴 백슬래시+n 두 글자를 문장 내용 그대로 출력하는 경우("...습니다.\n도착항..."처럼 화면에 글자 그대로 보임) — `text.replace(/\\n/g, '\n')`로 실제 개행 문자로 정규화.
   2. 그래도 개행이 전혀 없는 경우 — 문장 종결부호(`.!?`) 뒤에서 강제로 줄바꿈을 삽입한다(`ensureLineBreaks`).
   `reasoning`뿐 아니라 각 `risks[].description`에도 동일하게 적용된다.
5. **보정 고지**: 3번에서 서버가 모델 원안과 0.05kts 이상 다르게 보정했다면, reasoning 끝에 자동 보정 안내 문장을 한 줄 덧붙인다(ko/en 각각).
6. 성공 시 재분석 결과는 **DB(`EcoSpeedReport`)에 즉시 반영**되고(`recommendedSpeed`, 재계산된 `etaIfRecommended`, `reasoning`, `risks`, `aiAnalyzedAt` 등), 클라이언트는 이를 다시 조회해 화면에 표시한다 — 세션에만 남는 임시 상태가 아니므로 페이지 이동 후 돌아와도 결과가 유지된다.

---

## 4. 물류 일정관리 — AI 문서 자동 등록(PDF 파싱) 프롬프트

### 4.1 요청 구성

항차 등록 모달(`features/schedule/VoyageRegisterModal.tsx`)에서 PDF를 업로드/드래그앤드롭하면, 클라이언트가 파일을
base64로 읽어 현재 화면에 이미 있는 **선박 목록**과 **항구 목록**을 함께 보낸다(`VoyagePdfParseRequest`,
`features/schedule/voyagePdfParse.ts`):

| 필드 | 설명 |
| --- | --- |
| `lang` | ko/en |
| `fileBase64` | PDF 원본(최대 base64 14MB ≈ 원본 10MB) |
| `vessels` | `{ id, name, imo }[]` — 현재 함대 전체 |
| `ports` | `{ code, name, nameEn }[]` — 등록 가능한 항구 전체 |

이 기능의 특징은 **문서 자체를 텍스트로 미리 추출하지 않고 PDF 바이너리를 그대로 Gemini에 첨부**한다는 점이다
(`inlineData`). 별도 OCR/PDF-파싱 라이브러리 없이 Gemini의 네이티브 문서 이해 능력에 의존한다.

```ts
contents: [
  { text: buildPrompt(body) },
  { inlineData: { mimeType: 'application/pdf', data: body.fileBase64 } },
]
```

### 4.2 프롬프트 템플릿

```
You are a maritime logistics operations assistant. You are given a PDF document (a voyage order, booking
confirmation, shipping instruction, or fixture recap) for a single ocean voyage. Extract the voyage
registration fields listed below EXACTLY as stated in the document. Never invent a value that is not present
in or clearly derivable from the document.

Known vessel roster (pick the "id" of the entry whose name or IMO number matches the vessel named in the
document; if no entry matches with reasonable confidence, output an empty string for vesselId):
{vessels 목록, "- id="{id}" | name="{name}" | IMO {imo}" 형식}

Known port list (pick the "code" of the entry whose name/city matches the load port and discharge port
named in the document; match loosely across capitalization, English/Korean naming, and common
abbreviations; if truly no match, output an empty string):
{ports 목록, "- code="{code}" | {name} / {nameEn}" 형식}

Extract:
1. "vesselId": the id from the roster above, or "" if no confident match.
2. "departurePortCode" / "arrivalPortCode": codes from the port list above, or "" if no confident match.
3. "etd": the vessel's departure date/time (ETD / laycan commencement / sailing date) as an ISO 8601
   datetime WITH a numeric timezone offset, e.g. "2026-08-25T09:00:00+09:00" -- never use a timezone
   abbreviation like "KST" inside the ISO string itself, always convert to +HH:MM. If only a date is given
   with no time, use 00:00:00 in a timezone reasonable for that port.
4. "rta": the customer/consignee/charterer's REQUIRED or REQUESTED arrival deadline (look for terms like
   RTA, Required/Requested Time of Arrival, cancelling date, delivery deadline) as ISO 8601 with numeric
   timezone offset.
5. "sta": the carrier's own SCHEDULED/estimated arrival date if separately stated (e.g. STA, Line Schedule
   ETA), as ISO 8601 with numeric timezone offset. If the document does not distinguish this from RTA,
   output "".
6. "rtaConfirmed": true only if the document explicitly marks the RTA/deadline as confirmed, fixed, or firm
   (e.g. "[CONFIRMED]", "firm", "fixed"); false if tentative, estimated, or not stated.
7. "cargoDescription": a concise description of the cargo/commodity.
8. "cargoTon": total cargo weight in metric tons as a plain number (convert units if necessary).
9. "fuelType": one of "HFO", "MGO", "LNG" -- map the closest bunker grade mentioned (e.g. "IFO380",
   "VLSFO", "HSFO" -> "HFO"; "MDO", "gasoil" -> "MGO"; "LNG" -> "LNG"). Default to "HFO" if nothing is
   mentioned.
10. "plannedSpeedKnots": the instructed/planned service speed in knots as a plain number. Use the midpoint
    if a range is given. Default to 14 if nothing is mentioned.

The document may be in {Korean|English} or English regardless of which language you respond in -- respond
with the JSON fields only, values as specified above (not translated prose).
```

핵심 설계 포인트: **선박/항구는 자유 텍스트로 받지 않고, 현재 시스템에 실재하는 값의 화이트리스트("roster") 중
하나를 고르게 한다.** 모델이 문서에서 읽은 선박명·항구명이 시스템의 어떤 레코드에 해당하는지 스스로 매칭해 정확한
`id`/`code`를 반환하도록 요구하고(느슨한 매칭 허용, 자신 없으면 빈 문자열), 서버가 이를 다시 화이트리스트로
검증한다 — 이중 방어로 존재하지 않는 선박/항구가 등록되는 것을 막는다.

### 4.3 응답 스키마

```json
{
  "type": "OBJECT",
  "properties": {
    "vesselId": { "type": "STRING" },
    "departurePortCode": { "type": "STRING" },
    "arrivalPortCode": { "type": "STRING" },
    "etd": { "type": "STRING" },
    "rta": { "type": "STRING" },
    "sta": { "type": "STRING" },
    "rtaConfirmed": { "type": "BOOLEAN" },
    "cargoDescription": { "type": "STRING" },
    "cargoTon": { "type": "NUMBER" },
    "fuelType": { "type": "STRING", "enum": ["HFO", "MGO", "LNG"] },
    "plannedSpeedKnots": { "type": "NUMBER" }
  },
  "required": ["vesselId", "departurePortCode", "arrivalPortCode", "etd", "rta", "sta", "rtaConfirmed",
               "cargoDescription", "cargoTon", "fuelType", "plannedSpeedKnots"]
}
```

### 4.4 서버 후처리 — "핵심 필드 실패" vs "보조 필드 완화"를 구분

이 라우트의 검증은 필드마다 실패 시 처리 수준을 다르게 둔 것이 특징이다.

- **핵심 필드(파싱 실패 시 전체 요청을 `upstream_error`로 실패 처리)**: `etd`, `rta`가 `Date.parse`로 파싱 가능한
  값이어야 한다. 이 두 값이 없으면 항차 등록 자체가 의미 없기 때문에 폴백하지 않는다.
- **보조 필드(파싱/매칭 실패 시 빈 값으로 완화, 요청 자체는 성공 처리)**:
  - `vesselId` / `departurePortCode` / `arrivalPortCode`: 서버가 받은 `vessels`/`ports` 화이트리스트에 실제로
    존재하는 값인지 재검증 — 없으면 빈 문자열로 무시(모델이 화이트리스트에 없는 값을 지어냈어도 걸러짐).
  - `sta`: 파싱 안 되면 빈 문자열로 무시(선택 필드이므로).
  - 나머지(`cargoTon`, `plannedSpeedKnots`)는 0 이상으로 clamp만 하고 그대로 통과 — 화면의 폼 검증(0보다 커야
    함)이 최종 방어선 역할을 한다.
- 클라이언트는 응답에서 `vesselId`/`departurePortCode`/`arrivalPortCode` 중 하나라도 빈 문자열이면 "일부 항목은
  자동으로 인식하지 못했습니다" 안내를 띄우고, 나머지 필드는 정상 반영해 사용자가 직접 채우게 한다(`partial` 상태) —
  전부 성공하면 `success`.

---

## 5. 두 프롬프트에 공통된 설계 원칙

1. **Ground truth 주입, 재계산 금지 지시**: 재분석 프롬프트의 "필요 속도" 하한선처럼, 서버가 이미 정확히 계산한
   숫자는 모델에게 "다시 계산하지 말고 그대로 사실로 받아들이라"고 명시한다. LLM의 산술 오차를 프롬프트 단계에서
   원천 차단하는 패턴이다.
2. **구조화 출력(JSON Schema) 강제**: 두 라우트 모두 자유 텍스트 응답을 정규식으로 파싱하지 않는다.
   `responseSchema`로 필드 타입·enum까지 강제해 파싱 실패율을 낮춘다.
3. **화이트리스트 재검증(환각 방지)**: 모델이 고른 enum/roster 값을 서버가 다시 한번 허용 목록과 대조한다
   (`fuelType`, `risk.level/category`, `vesselId`, `departurePortCode/arrivalPortCode`). 모델이 스키마를 지켰다고
   해서 그 값이 시스템 관점에서도 유효하다고 가정하지 않는다.
4. **서버측 불변식 강제(하드 클램프)**: 도메인 규칙(예: "권장 속도는 항상 마감을 지킨다")은 프롬프트 지시만으로
   보장하지 않고, 응답을 받은 뒤 코드로 최종 보정한다. 프롬프트는 "가이드"일 뿐 "신뢰의 경계"는 항상 서버 코드다.
5. **필드별 실패 허용 수준 차등화**: 모든 필드를 동일하게 취급하지 않는다. 없으면 기능이 성립하지 않는 필드(속도,
   ETD/RTA)는 하드 실패, 사용자가 화면에서 쉽게 보완할 수 있는 필드(선박/항구 매칭, STA)는 소프트 완화.
6. **언어 파라미터화**: 두 프롬프트 모두 `lang`을 받아 "Write the response in {Korean|English}"로 응답 언어를
   지정한다 — 프롬프트 원문 자체는 항상 영어로 고정(모델 이해도가 가장 안정적인 언어), 출력 언어만 동적으로 바뀐다.
7. **우아한 실패(Graceful Degradation)**: API 키 미설정·업스트림 오류 시 예외를 던지지 않고 기존 데이터를 그대로
   유지한 채 사용자에게 실패 사유를 안내한다. AI 기능이 이 앱의 핵심 등록/조회 흐름을 막지 않는다.

---

## 6. 현재 사용 중인 모델 — 라우트별로 다른 Gemini 2.5 티어

> **2026-08-10 개정**: 처음에는 두 라우트 모두 `gemini-2.5-flash`를 기본값으로 썼다. 사용자 피드백("동일한
> 문구가 반복되는 등 AI 분석 근거의 품질이 아쉽다")을 반영해, 서술 품질이 중요한 `/api/ai-report/reanalyze`만
> `gemini-2.5-pro`로 기본값을 바꿨다. 단순 필드 추출 위주인 `/api/voyages/parse-pdf`는 지연시간이 더 중요해
> Flash를 그대로 유지한다 — 아래 7장에서 "하이브리드 전략"으로 제안했던 방향을 실제 기본값으로 반영한 것이다.

| 라우트 | 모델 | 이유 |
| --- | --- | --- |
| AI 운항 리포트 재분석 | `gemini-2.5-pro` | 5~8포인트짜리 종합 분석·리스크별 상세 설명의 서술 품질(중복 없는 근거 전개)이 사용자 판단에 직결 |
| 물류 일정관리 PDF 자동 등록 | `gemini-2.5-flash` | 정해진 필드 10개를 추출하는 단순 작업이라 응답 속도가 더 중요 |

두 모델 다 아래 장점을 공유하며, 이 프로젝트의 두 사용 사례에 특히 잘 맞는다:

| 장점 | 이 프로젝트에서의 의미 |
| --- | --- |
| **네이티브 멀티모달(PDF 직접 이해)** | `parse-pdf`(Flash)에서 별도 OCR/PDF 텍스트 추출 라이브러리 없이 PDF 바이너리를 그대로 첨부해 처리 — 구현이 단순해지고, 표/레이아웃이 섞인 실제 서류(항해지시서 등)도 그대로 읽는다. |
| **Flash의 낮은 지연시간** | `parse-pdf`는 사용자가 업로드 직후 결과를 기다리는 동기적 UX라 응답 속도가 체감 품질에 직결된다 — Flash 유지 이유. 재분석(Pro)은 원래도 "약 15~30초 소요" 안내 배너를 띄우는 흐름이라 Pro의 다소 느린 응답을 사용자가 이미 예상하고 기다린다. |
| **강력한 구조화 출력(`responseSchema`) 지원** | 두 기능 모두 엄격한 JSON 스키마 준수에 의존한다 — Pro/Flash 모두 스키마 강제 기능이 안정적으로 동작해 파싱 실패가 드물다. |
| **긴 컨텍스트(최대 100만 토큰급)** | 현재는 프롬프트가 짧지만, 향후 여러 항차·과거 리포트를 통째로 컨텍스트에 넣는 식으로 확장해도 여유가 크다. |
| **Vertex AI 경로 지원** | 이 프로젝트는 GCP(Cloud SQL, Cloud Run)에 이미 깊게 통합돼 있다 — `@google/genai` SDK가 API 키 방식과 Vertex AI(서비스 계정/ADC) 방식을 모두 지원해, 로컬은 API 키로 빠르게 개발하고 프로덕션은 Vertex AI로 IAM 기반 인증·리전 고정을 그대로 쓸 수 있다. |
| **비용 효율 + 무료 티어** | `parse-pdf`(Flash)는 토큰당 비용이 낮고 무료 사용량 한도가 있어 해커톤·저트래픽 서비스에 적합하다. 재분석(Pro)은 상대적으로 비싸지만, 사용자가 버튼을 눌러야만 호출되는 저빈도 상호작용이라 총 비용 영향은 제한적이다. |

---

## 7. 대안 모델 검토

아래는 같은 방식(구조화 출력 + PDF 첨부)으로 교체 가능한 후보들이다. 이 프로젝트는 `GEMINI_MODEL` 환경변수 하나만
바꾸면 같은 계열(Gemini) 내에서는 즉시 교체할 수 있고, 다른 제공사로 넘어가려면 `@google/genai` 클라이언트
초기화 부분(`GoogleGenAI`)을 해당 SDK로 바꿔야 한다. **Gemini 2.5 Pro는 이미 재분석 라우트의 기본값으로
채택되어 6장에 있으므로, 이 표는 아직 검토만 된 나머지 후보를 다룬다.**

| 모델 | 제공사 | 강점 | 이 프로젝트에 적용 시 고려사항 |
| --- | --- | --- | --- |
| **Claude (Sonnet/Opus 계열)** | Anthropic | 긴 문서·복잡한 표 이해에 강하고, PDF를 네이티브로 첨부 가능. Tool use로 이 프로젝트와 동일한 JSON 스키마 강제 방식 구현 가능 | GCP의 **Vertex AI Model Garden**에서 Claude 모델도 서빙되므로, 이미 Vertex AI 경로가 구축된 이 프로젝트는 인증·배포 구조를 그대로 두고 모델만 교체하는 전환비용이 낮다. 다만 SDK 호출 방식(`@google/genai` → Anthropic SDK 또는 Vertex의 Anthropic 클라이언트)은 별도 통합이 필요 |
| **GPT-4.1 / GPT-4o** | OpenAI | 범용 성능이 고르고 JSON 스키마 강제(Structured Outputs) 지원, 생태계·문서가 방대 | GCP 바깥의 별도 API 키·과금 체계가 필요해, 현재 "Vertex AI 또는 Gemini API 키 하나로 통일"된 인증 구조의 단순함이 깨짐 |
| **Gemini 2.5 Flash-Lite** | Google | Flash보다도 더 빠르고 저렴 | `parse-pdf`에 시험적으로 적용해볼 만하다(재분석은 이미 Pro로 반대 방향 — 품질 우선 — 으로 옮겨졌으므로 대상 아님) |

### 권장

1. **재분석은 Gemini 2.5 Pro 유지(적용 완료)** — 근거 서술의 품질(중복 없이 폭넓은 종합 판단)이 속도보다
   중요하다는 것이 명확해졌고, 이미 "약 15~30초 소요" 안내를 전제로 한 흐름이라 Pro의 응답 시간 증가가
   사용자 기대와 크게 어긋나지 않는다.
2. **PDF 파싱(`parse-pdf`)은 Flash 유지** — 정해진 필드 추출 위주 작업은 이미 충분한 정확도를 보이고,
   업로드 직후 결과를 기다리는 흐름이라 응답 속도 이점이 더 크다.
3. **PDF 파싱 정확도가 더 중요해지면(예: 손글씨·저품질 스캔 서류 지원 확대) Claude 계열을 Vertex AI Model
   Garden 경로로 A/B 검토** — 이미 Vertex AI 인증 구조가 있어 새 API 키 발급 없이 시도해볼 수 있는 가장 저마찰
   대안이다.
4. OpenAI 계열은 현재 "GCP 통합 인증 단일화"라는 이 프로젝트의 설계 이점을 깨뜨리므로, 다른 두 후보로 해결이
   안 되는 뚜렷한 이유가 없다면 권장하지 않는다.
