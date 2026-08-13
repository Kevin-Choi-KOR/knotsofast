export interface Port {
  code: string
  name: string
  nameEn: string
  lat: number
  lng: number
  // 해당 항구의 표준시(DST 미반영, 단순화) UTC 오프셋 — "LT (UTC+X)" 형식의 현지시각 표기에 사용.
  utcOffset: number
}

// 자사·타사 항차 목업에서 공통으로 참조하는 주요 항구 사전
export const PORTS: Port[] = [
  { code: 'PUS', name: '부산',       nameEn: 'Busan',          lat: 35.10,  lng: 129.04,  utcOffset: 9  },
  { code: 'ULS', name: '울산',       nameEn: 'Ulsan',          lat: 35.50,  lng: 129.30,  utcOffset: 9  },
  { code: 'GGY', name: '광양',       nameEn: 'Gwangyang',      lat: 34.90,  lng: 127.70,  utcOffset: 9  },
  { code: 'INC', name: '인천',       nameEn: 'Incheon',        lat: 37.45,  lng: 126.60,  utcOffset: 9  },
  { code: 'SHA', name: '상하이',     nameEn: 'Shanghai',       lat: 31.20,  lng: 121.50,  utcOffset: 8  },
  { code: 'HKG', name: '홍콩',       nameEn: 'Hong Kong',      lat: 22.30,  lng: 114.20,  utcOffset: 8  },
  { code: 'SIN', name: '싱가포르',   nameEn: 'Singapore',      lat: 1.30,   lng: 103.80,  utcOffset: 8  },
  { code: 'KHH', name: '가오슝',     nameEn: 'Kaohsiung',      lat: 22.60,  lng: 120.30,  utcOffset: 8  },
  { code: 'TYO', name: '도쿄',       nameEn: 'Tokyo',          lat: 35.60,  lng: 139.80,  utcOffset: 9  },
  { code: 'YOK', name: '요코하마',   nameEn: 'Yokohama',       lat: 35.45,  lng: 139.65,  utcOffset: 9  },
  { code: 'MNL', name: '마닐라',     nameEn: 'Manila',         lat: 14.60,  lng: 120.95,  utcOffset: 8  },
  { code: 'PHE', name: '포트헤들랜드', nameEn: 'Port Hedland', lat: -20.30, lng: 118.60,  utcOffset: 8  },
  { code: 'RTN', name: '라스 타누라', nameEn: 'Ras Tanura',    lat: 26.60,  lng: 50.20,   utcOffset: 3  },
  { code: 'DXB', name: '두바이',     nameEn: 'Dubai',          lat: 25.00,  lng: 55.06,   utcOffset: 4  },
  { code: 'RTM', name: '로테르담',   nameEn: 'Rotterdam',      lat: 51.90,  lng: 4.50,    utcOffset: 1  },
  { code: 'ANT', name: '앤트워프',   nameEn: 'Antwerp',        lat: 51.26,  lng: 4.40,    utcOffset: 1  },
  { code: 'HAM', name: '함부르크',   nameEn: 'Hamburg',        lat: 53.50,  lng: 9.90,    utcOffset: 1  },
  { code: 'FEL', name: '펠릭스토',   nameEn: 'Felixstowe',     lat: 51.96,  lng: 1.35,    utcOffset: 0  },
  { code: 'PIR', name: '피레우스',   nameEn: 'Piraeus',        lat: 37.94,  lng: 23.63,   utcOffset: 2  },
  { code: 'BCN', name: '바르셀로나', nameEn: 'Barcelona',      lat: 41.35,  lng: 2.17,    utcOffset: 1  },
  { code: 'LAX', name: '로스앤젤레스', nameEn: 'Los Angeles',  lat: 33.70,  lng: -118.20, utcOffset: -8 },
  { code: 'LGB', name: '롱비치',     nameEn: 'Long Beach',     lat: 33.75,  lng: -118.19, utcOffset: -8 },
  { code: 'OAK', name: '오클랜드(미)', nameEn: 'Oakland',      lat: 37.80,  lng: -122.30, utcOffset: -8 },
  { code: 'SEA', name: '시애틀',     nameEn: 'Seattle',        lat: 47.60,  lng: -122.34, utcOffset: -8 },
  { code: 'VAN', name: '밴쿠버',     nameEn: 'Vancouver',      lat: 49.29,  lng: -123.11, utcOffset: -8 },
  { code: 'NYC', name: '뉴욕',       nameEn: 'New York',       lat: 40.70,  lng: -74.00,  utcOffset: -5 },
  { code: 'SAV', name: '서배너',     nameEn: 'Savannah',       lat: 32.08,  lng: -81.09,  utcOffset: -5 },
  { code: 'AKL', name: '오클랜드',   nameEn: 'Auckland',       lat: -36.80, lng: 174.80,  utcOffset: 12 },
  { code: 'SYD', name: '시드니',     nameEn: 'Sydney',         lat: -33.85, lng: 151.21,  utcOffset: 10 },
  { code: 'MEL', name: '멜버른',     nameEn: 'Melbourne',      lat: -37.84, lng: 144.93,  utcOffset: 10 },
]

export function findPort(code: string): Port | undefined {
  return PORTS.find(p => p.code === code)
}

export function formatPortLabel(port: Port): string {
  return `${port.name} (${port.nameEn})`
}

export function getPortCode(label: string): string | undefined {
  return PORTS.find((p) => formatPortLabel(p) === label)?.code
}
