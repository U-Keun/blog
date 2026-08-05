---
{"sticker":"lucide//lightbulb","tags":["Tauri","Supabase"],"dg-publish":true,"permalink":"/projects/tickly/tickly-v0-4-cloud-real-time-sync/","dgPassFrontmatter":true}
---

v0.4에서는 '멀티 디바이스에서 같은 체크리스트를 끊김 없이 쓰는 경험'을 목표로, 클라우드 동기화 + 실시간 동기화를 구현했다.  
이제 iPhone에서 체크하면 데스크톱에도 바로 반영되고, 카테고리/항목/반복 규칙/스트릭 기록까지 서버와 일관되게 맞춰진다.
### v0.4
- 인증: Apple Sign In, Google OAuth PKCE
- 동기화: Push(Pending/Deleted 반영) → Pull(최신 데이터 반영) → Delete(soft→server→local purge)
- 실시간: 로그인 시 Realtime 구독, 원격 변경 수신 즉시 Pull & UI 갱신 / 로컬 변경은 2초 디바운스로 Push
- 충돌 해결: `updated_at` 최신 우선 병합(Last-write-wins)
#### Cloud sync.
- Backend: Supabase (PostgreSQL + REST)
- Client: Rust `reqwest`
- Auth: Apple Sign In, Google OAuth PKCE
- 딥 링크: iOS/Android OAuth 콜백 처리
- iOS 환경변수: `.env` 런타임 로딩 불가 → `build.rs`에서 `cargo:rustc-env`로 주입
##### 동기화 대상
- `categories`
- `todos` : 항목 + 완료 상태
- `repeat rules`
- `completion_logs` : 스트릭 기록
##### 동기화 흐름
동기화는 로컬 변경을 먼저 정리하고, 서버 최신을 가져와 병합하는 방식으로 고정했다.
1) Push  : local.pending / local.deleted -> server 반영 
2) Pull  : server 최신 -> local upsert (updated_at 기준 병합) 
3) Delete: soft delete -> server delete 확인 -> local purge

> [!NOTE] 충돌 해결(Last-write-wins)
동일 항목이 여러 기기에서 수정될 수 있으니, 가장 현실적인 MVP 기준으로 `updated_at`이 더 최신인 쪽을 채택했다.

> [!NOTE] 삭제 동기화(soft delete → 확정 삭제)
삭제는 '즉시 삭제'로 가면 복구가 어렵고, 충돌이 생길 수 있기 때문에, 로컬에서 먼저 soft delete 처리를 하고, 서버에 삭제 요청을 반영한다. 동기화가 끝나고 서버에서도 삭제가 확정되면 로컬도 영구 삭제하도록 구현했다.
#### Real-time sync. + debounce push
1) 로그인 성공 시 WebSocket(Reatime) 연결
2) 관련 테이블 변경 이벤트 구독
3) 원격 변경 수신 시: 자동 Pull → UI 갱신
4) 로컬 변경 시: 2초 debounce 후 push (짧은 시간 다중 변경을 묶어 네트워크/충돌 리스크 감소)
5) 연결이 끊기면 exponential backoff로 재연결

> [!NOTE] 왜 '원격은 pull, 로컬은 debounced push'인가?
> 실시간이라고 해서 받는 즉시 로컬에 그대로 적용하면, 순서를 보장하지 못하거나 부분적으로 업데이트 되거나, 네트워크 상태에 따라 데이터가 누락 또는 중복될 수 있기 때문이다.
#### Model 변경
##### Local DB(SQLite) 확장
동기화를 위해 로컬이 서버를 추적할 수 있도록 필드를 추가했다 :
- `todos, categories | sync_id`
- `todos, categories | created_at`
- `todos, categories | updated_at`
- `todos, categories | sync_status` : `pending` / `synced` / `deleted`
- 새 테이블 추가 : `auth_session`, `sync_metadata`
##### Server DB(Supabase) Schema
- RLS로 사용자별 접근 제한 : `categories` / `todos` / `completion_logs`
#### UX 요약 : 동기화가 보이는 앱
설정에 클라우드 동기화 메뉴를 추가하여, 사용자가 체감할 수 있도록 만들어 두었다.

| 로그인 전                                                              | 로그인 후                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| ![simulator_screenshot_C51F4235-18FD-45D3-8A9B-8893121912EE.png](/img/user/Archive/attachments/simulator_screenshot_C51F4235-18FD-45D3-8A9B-8893121912EE.png) | ![simulator_screenshot_073B54CE-14C3-42AF-B89F-7707251092D9.png](/img/user/Archive/attachments/simulator_screenshot_073B54CE-14C3-42AF-B89F-7707251092D9.png) |

