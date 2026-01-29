---
{"sticker":"lucide//map","dg-publish":true,"permalink":"/projects/tickly/road-map/","dgPassFrontmatter":true}
---

## [[Projects/Tickly/Tickly v0.1\|Tickly v0.1]] : 로컬 MVP

### 목표
- '앱을 열면 바로 체크하고 닫는' 초경량 체크리스트 루프를 완성
- iOS 앱 스토어 배포
### MVP 범위
- [x] 카테고리/리스트(탭) 생성·수정·삭제
- [x] 항목 추가·수정(텍스트 인라인 편집)·체크/해제·삭제
- [x] 체크된 항목은 취소선(줄 긋기)
- [x] 항목 상세(MemoDrawer)
### 데이터 모델(초기)
- `categories` : id, title, sort_order…
- `todos` : id, category_id, text, is_done, sort_order, memo…
## [[Projects/Tickly/Tickly v0.2-0.3  repeat rule & streak\|v0.2]]  : 반복 규칙 스케줄링

### 목표
- '일일 초기화' 제거 후, 반복 규칙으로 체크리스트를 유지 및 재생성
### 구현
- [x] 반복 규칙: **매일 / 매주(요일 선택) / 매월(특정 일)**
- [x] 항목 생성/수정에서 반복 옵션 제공 (`RepeatSelector`)
- [x] 다음 실행일 자동 계산 (`RepeatService`)
- [x] 앱 시작 시 due된 항목 자동 재활성화 (`processRepeats`)
### Model 변경
- `todos | repeat_type` : (`none` | `daily` | `weekly` | `monthly`)
- `todos | repeat_detail` : (JSON: 요일 `[0-6]` / 일자 `[1-31]`)
- `todos | next_due_at` : (YYYY-MM-DD)
- `todos | last_completed_at` : (YYYY-MM-DD)
## [[Projects/Tickly/Tickly v0.2-0.3  repeat rule & streak\|v0.3]] : 스트릭 히트맵
### 목표
깃허브 잔디형 시각화로 항목별 스트릭을 보여주기.
### 구현
- [x] 연 단위 히트맵 캘린더 UI (최근 365일)
- [x] 완료 여부 2단계 색 농도
- [x] 항목별 추적 히트맵(track_streak 켠 항목만)
- [x] `FloatingActions`에 스트릭 버튼(불꽃) 추가
### Model 변경
- `todos | track_streak` : (0/1)    
- `completion_logs | item_id`
- `completion_logs | completed_on` : (YYYY-MM-DD)
- `completion_logs | completed_count`
- `completion_logs | PK` : (item_id, completed_on)
## v0.4 : 클라우드 동기화
### 목표
폰/맥/아이패드 사이에서 동일한 리스트를 쓰는 최소 기능.
### 구현
- [x] 소셜 로그인 : Apple
- [x] 동기화 대상: 카테고리, 항목, 완료 상태, 반복 규칙, 히트맵 로그
- [ ] 충돌 해결: 최신 수정 시간 우선(Last-Write-Wins)
- [x] 소셜 로그인 : Google
### Model 변경
- 모든 엔티티에 `updated_at` 추가
- 클라우드 ID 매핑 필드 추가(예: remote_id, owner_id 등)
## v0.5 : 공유 리스트 (팀 체크리스트)
### 목표
카테고리 단위로 한 리스트를 함께 체크
### 구현
- 공유 단위 : 카테고리
- 초대 방식: 링크 공유
- 권한: MVP에서는 편집 권한만(단순화)
- 공유된 리스트에서 항목 추가/완료 가능
### Model 변경
- `categories | share_id`    
- `categories | owner_id`
- `categories | category_members`
## v0.6 : iOS 위젯
### 목표
위젯으로 체크할 수 있도록 사용 빈도를 끌어올리기.
### 구현
- [ ] iOS 홈 위젯 1종 (Lock Screen 제외)
- [ ] 오늘의 체크리스트 표시 + 빠른 완료 토글
- [ ] 앱/위젯 데이터 공유: App Group 기반
> 위젯은 앱과 별도 프로세스라서, 공유 컨테이너(App Group) 또는 공유 UserDefaults(suiteName:)를 써서 데이터를 주고받는 구조가 기본이다.
### Model 변경
- App Group용 스토리지/캐시 구조 추가
    - 또는 공유 UserDefaults에 최소 요약 상태 저장