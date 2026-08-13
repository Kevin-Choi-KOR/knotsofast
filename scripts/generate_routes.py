"""
searoute-py를 사용해 항로 데이터를 사전 계산하고 JSON으로 저장합니다.
실제 해상 항로(육지 회피, 운하 자동 경유)를 생성합니다.

사용법:
  python3 scripts/generate_routes.py

출력:
  apps/web/src/mocks/routes.json       (항차 ID 기반, 자사+타사 40개 — 대시보드가 즉시 로드)
  apps/web/src/mocks/port-pairs.json   (항구쌍 기반, 435개 — 등록 모달에서 동적 import로만 로드)

두 파일을 분리한 이유: port-pairs.json은 항구 30곳의 전 조합(435개)이라 용량이 크다
(수 MB). routes.json에 합쳐두면 이 데이터가 필요 없는 대시보드 등 페이지의
번들에도 포함돼 초기 로드 성능(NFR: 대시보드 로드 < 3초)에 영향을 준다.
"""

import json
import sys
from pathlib import Path

try:
    from searoute import searoute
except ImportError:
    print("ERROR: searoute가 설치되지 않았습니다.")
    print("  pip install searoute")
    sys.exit(1)

# [longitude, latitude] 순서 (GeoJSON 표준)
VOYAGES = [
    {
        "id": "voy001",
        "label": "부산 → 로테르담 (수에즈 경유)",
        "from": [129.04, 35.10],   # 부산
        "to":   [4.50,   51.90],   # 로테르담
    },
    {
        "id": "voy002",
        "label": "상하이 → 로스앤젤레스 (북태평양 대권 항로)",
        "from": [121.50, 31.20],   # 상하이
        "to":   [-118.20, 33.70],  # 로스앤젤레스
    },
    {
        "id": "voy003",
        "label": "포트헤들랜드 → 광양 (철광석 항로)",
        "from": [118.60, -20.30],  # Port Hedland
        "to":   [127.70,  34.90],  # 광양
    },
    {
        "id": "voy004",
        "label": "라스 타누라 → 울산 (말라카 경유)",
        "from": [50.20, 26.60],    # Ras Tanura
        "to":   [129.30, 35.50],   # 울산
    },
    {
        "id": "voy005",
        "label": "함부르크 → 부산 (수에즈 경유)",
        "from": [9.90, 53.50],     # 함부르크
        "to":   [129.04, 35.10],   # 부산
    },
    {
        "id": "voy006",
        "label": "오클랜드 → 부산",
        "from": [174.80, -36.80],  # 오클랜드
        "to":   [129.04,  35.10],  # 부산
    },
]

# apps/web/src/mocks/ports.ts 와 동일한 좌표 (코드: [lng, lat])
PORTS = {
    "PUS": [129.04, 35.10],  "ULS": [129.30, 35.50],  "GGY": [127.70, 34.90],
    "INC": [126.60, 37.45],  "SHA": [121.50, 31.20],  "HKG": [114.20, 22.30],
    "SIN": [103.80, 1.30],   "KHH": [120.30, 22.60],  "TYO": [139.80, 35.60],
    "YOK": [139.65, 35.45],  "MNL": [120.95, 14.60],  "PHE": [118.60, -20.30],
    "RTN": [50.20, 26.60],   "DXB": [55.06, 25.00],   "RTM": [4.50, 51.90],
    "ANT": [4.40, 51.26],    "HAM": [9.90, 53.50],    "FEL": [1.35, 51.96],
    "PIR": [23.63, 37.94],   "BCN": [2.17, 41.35],    "LAX": [-118.20, 33.70],
    "LGB": [-118.19, 33.75], "OAK": [-122.30, 37.80], "SEA": [-122.34, 47.60],
    "VAN": [-123.11, 49.29], "NYC": [-74.00, 40.70],  "SAV": [-81.09, 32.08],
    "AKL": [174.80, -36.80], "SYD": [151.21, -33.85], "MEL": [144.93, -37.84],
}

# apps/web/src/mocks/otherFleet.ts 의 ROUTE_PAIRS 와 반드시 동일한 순서를 유지해야 함
OTHER_ROUTE_PAIRS = [
    ("PUS", "LAX"), ("SHA", "LAX"), ("SHA", "LGB"), ("HKG", "LAX"), ("KHH", "OAK"),
    ("SIN", "RTM"), ("SHA", "HAM"), ("HKG", "ANT"), ("PUS", "RTM"), ("YOK", "SEA"),
    ("TYO", "VAN"), ("SIN", "DXB"), ("HKG", "SIN"), ("SHA", "SIN"), ("PUS", "SIN"),
    ("MNL", "PUS"), ("KHH", "SHA"), ("DXB", "ULS"), ("RTN", "ULS"), ("PHE", "GGY"),
    ("PHE", "SHA"), ("SIN", "FEL"), ("SIN", "PIR"), ("PIR", "BCN"), ("RTM", "NYC"),
    ("HAM", "SAV"), ("ANT", "NYC"), ("AKL", "PUS"), ("SYD", "SHA"), ("MEL", "SIN"),
    ("VAN", "TYO"), ("SEA", "YOK"), ("NYC", "RTM"), ("INC", "LAX"),
]

for idx, (dep, arr) in enumerate(OTHER_ROUTE_PAIRS):
    VOYAGES.append({
        "id": f"ovoy{idx + 1}",
        "label": f"[타사] {dep} → {arr}",
        "from": PORTS[dep],
        "to": PORTS[arr],
    })

# 신규 등록 항차(런타임 발급 ID)는 사전 계산된 voyage ID와 매칭될 수 없으므로,
# "{항구코드}-{항구코드}" 키로도 조회 가능하도록 항구 사전의 전체 조합을 별도 계산한다.
# 코드는 알파벳 오름차순으로 정렬해 저장하고(중복 방향 계산 방지),
# 앱에서는 apps/web/src/shared/utils/routeLookup.ts가 역방향 조회 시 좌표를 뒤집어 사용한다.
PORT_PAIRS = [
    (a, b) for i, a in enumerate(sorted(PORTS)) for b in sorted(PORTS)[i + 1:]
]

PORT_PAIR_VOYAGES = [
    {
        "id": f"{a}-{b}",
        "label": f"[항구쌍] {a} → {b}",
        "from": PORTS[a],
        "to": PORTS[b],
    }
    for a, b in PORT_PAIRS
]

def compute_routes(voyages):
    results = {}

    for v in voyages:
        vid = v["id"]
        print(f"  계산 중: {v['label']} ...", end=" ", flush=True)
        try:
            route = searoute(v["from"], v["to"], units="naut")
            coords = route["geometry"]["coordinates"]
            distance_nm = round(route["properties"].get("length", 0), 1)

            # GeoJSON [lng, lat] → {lat, lng}
            points = [{"lat": round(lat, 4), "lng": round(lng, 4)} for lng, lat in coords]
            results[vid] = {
                "points": points,
                "distanceNm": distance_nm,
                "waypoints": len(points),
            }
            print(f"완료 ({len(points)} pts, {distance_nm} nm)")
        except Exception as e:
            print(f"실패 → {e}")
            results[vid] = None

    return results

def write_json(voyages, results, out_path, label):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    success = sum(1 for v in results.values() if v is not None)
    print(f"\n[{label}] 완료: {success}/{len(voyages)} 항로 계산 성공")
    print(f"저장됨: {out_path}")

def main():
    mocks_dir = Path(__file__).parent.parent / "apps" / "web" / "src" / "mocks"

    print("searoute-py 항로 계산 시작 — 항차 ID 기반\n")
    voyage_routes = compute_routes(VOYAGES)
    write_json(VOYAGES, voyage_routes, mocks_dir / "routes.json", "routes.json")

    print("\nsearoute-py 항로 계산 시작 — 항구쌍 기반\n")
    port_pair_routes = compute_routes(PORT_PAIR_VOYAGES)
    write_json(PORT_PAIR_VOYAGES, port_pair_routes, mocks_dir / "port-pairs.json", "port-pairs.json")

if __name__ == "__main__":
    main()
