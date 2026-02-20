---
{"sticker":"lucide//lightbulb","tags":["Tauri","Supabase"],"dg-publish":true,"permalink":"/projects/tickly/tickly-v0-5-0-6-tags-and-graph-view/","dgPassFrontmatter":true}
---

v0.5~v0.6에서는 항목을 단순 체크 대상으로 두지 않고, 관계를 가진 정보로 다루는 방향에 집중했다.  
v0.5에서 태그 기반 분류를 만들고, v0.6에서 category-tag-item 관계를 그래프로 시각화했다.

![스크린샷 2026-02-13 오후 4.20.48.png|center|300](/img/user/Archive/attachments/%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202026-02-13%20%EC%98%A4%ED%9B%84%204.20.48.png)

### v0.5 : tags
항목(todo)에 태그를 붙여 카테고리 횡단 탐색이 가능하도록 만들었다.

#### 구현
- 태그 부착/제거: 항목 추가/수정 흐름에서 즉시 관리
- 자동완성 + 자동생성: 입력값 기반 제안(최대 5개) + Enter로 빠른 생성
- 태그 필터링: 단일 태그 선택으로 전체 항목을 카테고리 횡단 조회
- 태그 관리: 설정 화면에서 등록 태그 조회/삭제
- 리스트 표시: 항목 카드에는 태그 일부만 노출하고(`2개 + N`), 상세에서 전체 확인

#### Model 변경
- `tags`
  - `id`, `name`(`UNIQUE`)
  - `sync_id`, `created_at`, `updated_at`, `sync_status`
- `todo_tags`
  - `todo_id`, `tag_id` (join)
  - `PRIMARY KEY (todo_id, tag_id)`
  - `sync_id`, `created_at`, `sync_status`

#### 동기화/삭제 정책
- `tags`, `todo_tags` 모두 클라우드 동기화 및 Realtime 구독 대상
- 태그 삭제 시 동기화 이력이 있으면 soft delete(`sync_status = deleted`) 후 동기화 시 확정 삭제
- 동기화 이력이 없으면 로컬 즉시 삭제
- 태그 생성 시 trim + 중복 이름 재사용, pull 시 동일 이름 태그는 merge

### v0.6 : graph view
![스크린샷 2026-02-13 오후 4.22.08.png|cright|200](/img/user/Archive/attachments/%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7%202026-02-13%20%EC%98%A4%ED%9B%84%204.22.08.png)

태그/카테고리/항목 관계를 한 화면에서 보도록 그래프 뷰를 추가했다.

#### 렌더링/레이아웃
- PixiJS(WebGL) + d3-force
- iOS 환경 고려: WebGL 렌더러 기반
- force 설정: link + charge + collide + center

#### Node / Edge 설계
- `category` node: 12px
- `tag` node: 10px
- `item(todo)` node: 8px
- `item` - `category` edge
- `item` - `tag` edge

#### 인터랙션
- `category` 탭: 해당 카테고리 선택 후 메인 화면으로 이동
- `item` 탭: 완료/미완료 토글
- `tag` press: 연결 edge 강조 + 비연결 node dim 처리
- node drag: 개별 노드 위치 조정
- pan / zoom: 휠 줌 + 핀치 줌 + 드래그 패닝(0.2x ~ 3x)

> [!NOTE]
> 그래프는 UI 부하가 큰 편이라, 백엔드에서 node/edge를 조립(`get_graph_data`)해 프론트로 전달하는 구조로 구현했다.
