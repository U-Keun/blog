---
{"sticker":"lucide//lightbulb","tags":["Tauri","iOS"],"dg-publish":true,"permalink":"/areas/tickly/tickly-v0-7-item-reminder/","dgPassFrontmatter":true,"dg-note-properties":{"sticker":"lucide//lightbulb","tags":["Tauri","iOS"]}}
---

v0.7에서는 "기억해서 체크하는 앱"이 아니라 "제때 떠오르게 만드는 앱"으로 한 단계 올리는 데 집중했다.  
항목마다 알림 시간을 설정하고, 완료/재활성화/삭제 흐름에 맞춰 알림을 자동 갱신하도록 구성했다.  
또한 항목에 연결 앱을 붙여, 체크가 필요한 맥락으로 바로 이동할 수 있게 했다.

### v0.7 : item reminder
핵심은 알림 설정 자체보다, 할 일 상태 변화에 따라 스케줄이 항상 맞게 유지되도록 만드는 것이었다.

#### 구현
- 항목 추가/수정 모달에서 알림 시간(`HH:MM`) 설정/해제
- 앱 시작 시 알림 권한 확인 및 요청(`ensurePermission`)
- 항목별 고정 notification id 사용(`item.id`)으로 중복 스케줄 방지
- 알림 등록 전 기존 스케줄을 먼저 취소한 뒤 재등록(`cancel -> schedule`)
- 항목 완료 시 알림 자동 취소
- 완료 해제(재활성화) 시 알림 자동 재등록
- 항목 삭제 시 알림 자동 취소
- 앱 시작 시 미완료 + 알림 설정 항목 전체 재스케줄(`rescheduleAll`)
- 항목별 연결 앱 지정/해제(`linked_app`) + 상세 화면에서 앱 바로 열기
- 프리셋 앱 + 커스텀 URL scheme 앱 연결 지원

#### 반복 규칙 연동
- 반복 항목은 완료 시 알림이 취소된다.
- `processRepeats`로 항목이 due 상태로 재활성화되면, 앱 진입 시 `rescheduleAll`에서 다시 알림이 붙는다.

#### Notification 레이어
- Tauri Notification plugin 사용 (`tauri-plugin-notification`)
- `window.Notification` 대신 native invoke 경로 사용
  - `plugin:notification|request_permission`
  - `plugin:notification|notify`
  - `plugin:notification|get_pending`
  - `plugin:notification|cancel`

> [!NOTE] iOS 대응
> iOS WKWebView에서 날짜 직렬화 이슈를 피하기 위해 `Schedule.at` 대신 `interval(hour, minute)` 방식으로 스케줄링했다.  
> 현재 동작은 "지정 시간의 일일 반복 알림" 기준이다.

#### Model 변경
- `todos | reminder_at` (`TEXT`, nullable)
- `todos | linked_app` (`TEXT`, nullable)
- sync payload에 `reminder_at` 포함 (push/pull 대상)
- sync payload에 `linked_app` 포함 (push/pull 대상)

#### UX 요약
- Add/Edit의 고급 설정에서 알림 시간 지정
- Add/Edit의 고급 설정에서 연결 앱 지정
- 설정된 항목은 상세(MemoDrawer)에서 시간 확인 가능
- 설정된 연결 앱은 상세에서 즉시 열기 가능
- 알림 해제 버튼으로 즉시 취소 가능
- 권한이 거부된 경우 알림 등록은 건너뛰고 앱 동작은 유지
