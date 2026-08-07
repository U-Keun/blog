---
{"sticker":"lucide//lightbulb","dg-publish":true,"tags":["Tauri"],"permalink":"/areas/tickly/tickly-v0-2-0-3-repeat-rule-and-streak/","dgPassFrontmatter":true,"dg-note-properties":{"sticker":"lucide//lightbulb","tags":["Tauri"]}}
---

![Tickly_v0.2-3_overview.png\|center\|200](/img/user/Archive/attachments/Tickly_v0.2-3_overview.png)
[[Areas/Tickly/Tickly v0.1\|기존 버전]]에 이어서 기능을 추가하고 있다. v0.2-0.3에서는 반복 규칙 기반 체크리스트 유지 기능과 스트릭(잔디) 시각화 기능이 추가되었다.
### v0.2 : repeat rule
기존에 구현해 두었던 일일 자동 초기화를 제거하고, 반복 규칙으로 체크리스트를 재활성화할 수 있도록 바꾸었다. 핵심 기능은 다음과 같다 : 

| 매일                          | 매주(요일 선택)                     | 매월(특정 일)                       |
| --------------------------- | ----------------------------- | ------------------------------ |
| ![Tickly_repeat_item.png](/img/user/Archive/attachments/Tickly_repeat_item.png) | ![Tickly_repeat_weekly.png](/img/user/Archive/attachments/Tickly_repeat_weekly.png) | ![Tickly_repeat_monthly.png](/img/user/Archive/attachments/Tickly_repeat_monthly.png) |

- 항목 생성/수정 흐름에서 반복 옵션 설정 가능
- 다음 실행일 자동 계산 및 앱 시작시 해당 항목 재활성화 프로세스 추가
#### Model 변경
`todos` 테이블에 반복 규칙 관련 필드를 추가했다.
- `todos | repeat_type` : `none` | `daily` | `weekly` | `monthly`
- `todos | repeat_detail` : JSON 요일 배열(`[0-6]`) / 날짜 배열(`[1-31]`)
- `todos | next_due_at` : 다음 활성화 시점(`YYYY-MM-DD`)
- `todos | last_completed_at` : 마지막 완료 시점
#### UX 요약
![Tickly_repeat_show.png\|right\|200](/img/user/Archive/attachments/Tickly_repeat_show.png)
- 반복이 없는 항목은 기존처럼 수동 체크 후 유지된다.
- 반복이 있는 항목은 완료 시 다음 주기로 `next_due_at`을 설정하고, 해당 날짜에 자동으로 재활성화 된다.
- 항목 카드에는 반복 아이콘이 표시되며, 메모에서 반복 설정 확인/수정이 가능하다.
#### Bug fix
1. 반복 항목이 자동으로 재활성화되지 않음
	- 증상 : 매일/매주/매월 반복 설정한 항목이 다음날 앱을 열어도 자동으로 체크가 해제되지 않았다.
	- 원인 : `processRepeats()` 함수가 `onMount`에서만 호출되어, iOS에서 앱이 background에서 foreground로 돌아올 때 재실행되지 않은 것으로 보인다.
	- 해결 : `visibilitychange` 이벤트 리스너를 추가해서 foreground 복귀 시 `processRepeatsAndReload()` 함수가 호출되도록 로직을 수정했다.
### v0.3 : streak heatmap
![Tickly_streak.png\|right\|200](/img/user/Archive/attachments/Tickly_streak.png)
항목별 수행 흐름을 확인할 수 있는 GitHub 잔디 스타일의 히트맵을 도입했다. 최근 365일을 기준으로 스트릭을 보여준다. 핵심 기능은 다음과 같다 : 
- 연 단위 히트맵 캘린더 UI(최근 365일)
- 완료 여부에 따른 2단계 색 표시(미완료/완료)
- 항목별 추적 히트맵 : 사용자가 지정한 항목만 개별 히트맵을 표시
- FloatingActions에 스트릭 버튼(불꽃 아이콘) 추가
#### Model 변경
`todos` 테이블에 필드를 하나 추가하고, `completion_logs` 테이블을 추가했다.
- `todos | track_streak` : 스트릭 추적 여부
- `completion_logs | item_id` : 추적 대상 항목 ID
- `completion_logs | completed_on` : 완료 날짜(`YYYY-MM-DD`)
- `completion_logs | PRIMARY KEY` : (`item_id`, `completed_on`)
#### UX 요약
- FloatingActions 메뉴에서 스트릭 버튼 -> 모달 진입
- 추적 중인 항목이 없으면 빈 상태 메시지
- MemoDrawer에서 '스트릭 추적' 토글로 추적 대상을 지정

### UI present
![Tickly_v0.3.png\|center\|300](/img/user/Archive/attachments/Tickly_v0.3.png)
