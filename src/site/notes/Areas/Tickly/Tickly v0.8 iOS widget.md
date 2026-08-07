---
{"sticker":"lucide//lightbulb","tags":["Tauri","iOS","WidgetKit"],"dg-publish":true,"permalink":"/areas/tickly/tickly-v0-8-i-os-widget/","dgPassFrontmatter":true,"dg-note-properties":{"sticker":"lucide//lightbulb","tags":["Tauri","iOS","WidgetKit"]}}
---

v0.8에서는 앱을 열지 않고도 체크를 끝낼 수 있는 흐름을 만들어보았다. 핵심은 '위젯에서 보고, 바로 체크하고, 앱과 상태가 어긋나지 않게 동기화'되는 구조다.

### v0.8 : iOS widget
홈 위젯에서 바로 체크 가능한 형태로 확장했다.

#### 구현
- iOS 홈 위젯 지원 (`small` / `medium` / `large`)
- 카테고리별 위젯 구성(AppIntent) 지원
  - `CategoryWidgetConfigurationIntent`로 표시 카테고리 선택
- 위젯에서 항목 체크 지원
  - `ToggleTodoIntent(openAppWhenRun = false)` 기반 인앱 진입 없는 토글
- 카테고리 요약 표시
  - 카테고리별 total/pending 집계, 완료율, overflow(`+N more`)
- 태그 요약 표시
  - 항목 태그를 `#first +N` 형태로 compact 표시
- 위젯 테마 연동
  - 앱 테마(`preset/custom color`)를 snapshot에 포함해 위젯 UI에 반영

#### 데이터 흐름
1) 앱에서 데이터 변경 발생  
   -> `refreshWidgetCache()` 호출로 최신 snapshot 생성
2) Rust `WidgetService`가 App Group 컨테이너에 `widget-cache.json` 저장
3) 위젯 extension이 snapshot 파일을 읽어 즉시 렌더링
4) 위젯에서 체크 시
   - extension에서 액션을 `widget-actions.json`에 큐잉
   - 위젯 화면은 낙관적 업데이트(즉시 반영)
5) 앱 시작/조회 시 `process_widget_actions`로 큐를 처리해 DB에 최종 반영

> [!NOTE] 일관성 전략
> 위젯은 DB에 직접 접근하지 않고, "snapshot 읽기 + action queue 쓰기" 방식으로 분리했다.  
> 앱이 큐를 수거해 `RepeatService` 기반 토글을 적용하므로, 반복 규칙/정렬 로직과 충돌하지 않는다.

#### Storage / 설정
- App Group: `group.com.u-keunsong.tickly`
- 캐시 파일: `widget-cache.json`
- 액션 큐: `widget-actions.json`
- 설정 키
  - `widget_cache_path`
  - `widget_app_group_id`

#### iOS 연동 포인트
- 앱/위젯 양쪽 entitlements에 동일 App Group 설정
- `setup-ios-widget.sh` + `xcodegen`으로 위젯 프로젝트 파일 동기화
- 위젯 갱신 시 `WidgetCenter.reloadAllTimelines()` 호출

#### UX 요약
- 홈 화면에서 카테고리 기반 체크리스트 즉시 확인
- 앱 진입 없이 항목 완료 처리 가능
- 앱으로 돌아오면 위젯 액션이 자동 반영되어 본문 리스트와 상태 일치
