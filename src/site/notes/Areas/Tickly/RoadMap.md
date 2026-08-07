---
{"sticker":"lucide//map","dg-publish":true,"permalink":"/areas/tickly/road-map/","dgPassFrontmatter":true,"dg-note-properties":{"sticker":"lucide//map"}}
---

## [[Areas/Tickly/Tickly v0.1\|Tickly v0.1]] : 로컬 MVP

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
## [[Areas/Tickly/Tickly v0.2-0.3  repeat rule & streak\|Tickly v0.2]]  : 반복 규칙 스케줄링

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
## [[Areas/Tickly/Tickly v0.2-0.3  repeat rule & streak\|Tickly v0.3]] : 스트릭 히트맵
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
## [[Areas/Tickly/Tickly v0.4 cloud real-time sync\|Tickly v0.4]] : 클라우드 동기화 + 실시간 동기화(0.4.2)
### 목표
아이폰/맥/아이패드에서 동일한 리스트를 쓰는 최소 기능 + 실시간 반영
### 구현
- [x] 소셜 로그인 : Apple Sign In, Google
- [x] 클라우드 동기화
	- 동기화 대상 : 카테고리, 항목, 완료 상태, 반복 규칙, 스트릭 로그(completion_logs)
	- 충돌 해결 : `updated_at` 기반 Last-Write-Wins
	- 삭제 동기화 : soft delete → 서버 삭제 → 로컬 영구 삭제
- [x] 세션 복원/갱신 : 앱 시작 시 세션 복원 + 만료 시 refresh
- [x] 실시간 동기화 : Supabase Realtime 구독(todos/categories/completion_logs)
    - 원격 변경 수신 → 자동 pull → UI 즉시 갱신
    - 로컬 변경 → 2초 debounce 후 push
    - 자동 재연결(exponential backoff, 최대 10회)
### Model 변경
- `todos, categories | sync_id`
- `todos, categories | created_at`
- `todos, categories | updated_at`
- `todos, categories | sync_status` : `pending` / `synced` / `deleted`
- 새 테이블 추가 : `auth_session`, `sync_metadata`
## [[Areas/Tickly/Tickly v0.5-0.6 tags & graph view\|Tickly v0.5]] : 태그
### 목표
항목(todo)에 태그를 붙여 분류하고, 그래프 뷰(v0.6)의 기반 데이터로 활용
### MVP 범위
- 태그 대상: 할 일 항목(todo)
- 태그 형식: 텍스트 전용(색상 없음)
- 태그 관리: 생성/삭제
- 자동완성: 입력 기반 기존 태그 제안(최대 5개)
- 항목당 복수 태그 가능
- 태그 기반 필터링: 단일 태그 기준 카테고리 횡단 조회
- 클라우드 동기화 + Realtime 구독 지원(`tags`, `todo_tags`)
### Model 변경
- `tags | id`
- `tags | name` : 유저 범위 UNIQUE
- `tags` 동기화 메타 데이터 : `sync_id`, `created_at`, `updated_at`, `sync_status`
- `todo_tags | todo_id` → todos
- `todo_tags | tag_id` → tags
- `todo_tags | PK` : (`todo_id`, `tag_id`)
- `todo_tags` 동기화 메타 데이터 : `sync_id`, `created_at`, `sync_status`
## [[Areas/Tickly/Tickly v0.5-0.6 tags & graph view\|Tickly v0.6]] : 그래프 뷰
### 목표
category-tag-item 관계를 그래프로 시각화해 “전체 할 일의 구조”를 파악
### MVP 범위
- 노드: `category` + `tag` + `item`
- 노드 크기: `category(12px)` / `tag(10px)` / `item(8px)` 고정
- 엣지: `item-category`, `item-tag`
- 인터랙션
    - 카테고리 노드 탭: 해당 카테고리 선택 후 메인 화면 이동
    - 항목 노드 탭: 완료/미완료 토글
    - 태그 노드 press: 연결 관계 하이라이트
    - 드래그/줌/패닝 지원(휠 + 핀치)
## [[Areas/Tickly/Tickly v0.7 item reminder\|Tickly v0.7]] : 항목 알림
### 목표
특정 항목에 알림을 설정해서 잊지 않고 실행
### MVP 범위
- 항목별 알림 시간 설정(`HH:MM`)
- 완료/삭제/재활성화 상태 변화에 맞춘 자동 취소/재등록
- 앱 시작 시 미완료 알림 항목 재스케줄
- 항목별 연결 앱 지정 및 상세 화면에서 바로 열기
- 로컬 알림(iOS Notification)
### 데이터 모델 변경
- `todos.reminder_at` (`TEXT` / nullable)
- `todos.linked_app` (`TEXT` / nullable)
- 클라우드 동기화 payload 포함
## Tickly v0.8 : 공유 리스트 (팀 체크리스트)
### 목표
카테고리 단위로 한 리스트를 **여러 사람이 함께 체크**
### MVP 범위
- 공유 단위: 카테고리
- 초대 방식: 링크 공유
- 권한: MVP는 편집 권한만(단순화)
- 공유된 리스트에서 항목 추가/완료 가능
### Model 변경(개념)
- `categories.share_id`
- `categories.owner_id`
- `category_members` (카테고리-유저 매핑)
## Tickly v0.9 : iOS 위젯
### 목표
앱을 열지 않고도 빠르게 체크 → 사용 빈도 상승
### MVP 범위
- iOS 홈 위젯 1종 (Lock Screen 제외)
- 오늘의 체크리스트 표시 + 빠른 완료 토글
- 앱/위젯 데이터 공유: App Group 기반
#### memo
- 위젯은 앱과 별도 프로세스
- App Group 컨테이너 또는 `UserDefaults(suiteName:)`로 최소 상태를 공유
- “위젯 표시용 요약 스냅샷”을 따로 유지하는 설계
    - 예: 카테고리별 상위 N개, 오늘 due 항목, done 상태 정도
