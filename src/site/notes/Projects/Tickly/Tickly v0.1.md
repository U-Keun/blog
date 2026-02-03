---
{"sticker":"lucide//lightbulb","tags":["Tauri"],"dg-publish":true,"permalink":"/projects/tickly/tickly-v0-1/","dgPassFrontmatter":true}
---

심플한 체크리스트를 만들고 싶었다. 그리고 Tauri를 제대로 연습해보고 싶었다

그래서 심플한 체크리스트 프로젝트를 시작했다. 이 프로젝트는 또한 Tauri를 실제 서비스 수준으로 연습해보기 위한 실험이기도 했다. 웹 스택을 유지하면서도 네이티브 앱으로 배포되는 흐름이 궁금했고, 그 과정을 직접 설계/구현해보고 싶었다.
## v0.1
Tickly는 미니멀한 체크리스트 앱이다. 할 일 관리보다 반복적으로 체크해야 하는 항목을 빠르게 처리하는 경험을 목표로 했다.
![tickly-v0.1.0.png|center|300](/img/user/Archive/attachments/tickly-v0.1.0.png)
#### 핵심 기능 요약
- 항목 추가/수정/삭제/완료 표시
- 항목별 메모
- SQLite 로컬 저장 (앱 재시작 후에도 데이터 유지)
- 자동 일일 초기화
- 카테고리 분리, 스와이프 삭제, 드래그 정렬
- 완료 항목 자동 정렬, 테마 커스터마이징
#### 기술 스택 선택
Tickly는 SvelteKit + Tauri + SQLite 조합으로 구현했다. 웹 기술의 생산성을 유지하면서도, iOS/데스크톱 크로스플랫폼까지 가능한 구조를 만들고 싶었다.
### 프로젝트 구조
어떤 계층 구조로 앱이 구성했는지 살펴보자. Tickly는 Frontend(SvelteKit)와 Backend(Tauri + Rust)가 분리된 구조다.
```bash
Tickly/ 
├── src/            # Frontend (SvelteKit) 
└── src-tauri/      # Backend (Rust + Tauri)
```
#### 1) 프론트엔드 구조
프론트는 기본적으로 Routes → Components로 구성되고, API Layer를 추가해서 구성했다. 화면 로직은 Routes[^1], 재사용 UI는 components, Tauri `invoke` 호출은 API layer에 모아두었다.
```bash
src/ 
├── routes/ 
│     ├── +page.svelte              # 메인 페이지
│     └── settings/
│           ├── +page.svelte          # 설정 메인 페이지
│           ├── theme/
│           │     └── +page.svelte      # 테마 설정 페이지
│           └── language/
│                 └── +page.svelte      # 언어 설정 페이지
├── components/                    # 재사용 가능한 컴포넌트
│     ├── ModalWrapper.svelte       # 공통 모달 레이아웃
│     ├── SettingsLayout.svelte     # 공통 설정 페이지 레이아웃
│     ├── BottomNav.svelte          # 하단 네비게이션 바
│     ├── FloatingActions.svelte    # FAB 버튼 (추가, 리셋)
│     ├── LeafTodoItem.svelte       # Todo 항목 컴포넌트
│     ├── AddItemModal.svelte       # 항목 추가 모달
│     ├── SwipeableItem.svelte      # 스와이프 삭제 래퍼
│     └── CategoryTabs.svelte       # 카테고리 탭
├── lib/
│   ├── api/                      # API 레이어 (Tauri invoke 래퍼)
│   │   ├── categoryApi.ts        # Category API
│   │   ├── todoApi.ts            # Todo API
│   │   └── settingsApi.ts        # Settings API
│   ├── stores/                   # Svelte 5 reactive stores
│   │   ├── appStore.svelte.ts    # 앱 상태 (카테고리, 항목)
│   │   └── modalStore.svelte.ts  # 모달 상태 관리
│   ├── i18n/                     # 다국어 지원
│   │   ├── i18nStore.svelte.ts   # i18n 스토어
│   │   ├── ko.ts                 # 한국어 번역
│   │   └── en.ts                 # 영어 번역
│   └── themes.ts                 # 테마 프리셋 및 유틸리티
├── types.ts                      # TypeScript 타입 정의
└── app.css                       # TailwindCSS + CSS 변수
```
#### 2) 백엔드 구조 (Rust + Tauri)
Backend는 Commands → Services → Repository → SQLite로 구성했다. 처음부터 나뉘어져 있던 것은 아니지만, 비즈니스 로직과 DB 접근을 분리해 두면 테스트/확장이 편하므로 나누어 두었다.
```bash
src-tauri/                        # Backend (Rust + Tauri)
├── src/
│   ├── lib.rs                    # 앱 진입점 및 모듈 등록
│   ├── models/                   # 데이터 모델
│   │     ├── category.rs           # Category 구조체
│   │     └── todo_item.rs          # TodoItem 구조체
│   ├── repository/               # 데이터 접근 레이어
│   │     ├── database.rs           # DB 초기화
│   │     ├── migration.rs          # 스키마 마이그레이션
│   │     ├── category_repo.rs      # Category CRUD
│   │     ├── todo_repo.rs          # Todo CRUD
│   │     └── settings_repo.rs      # Settings CRUD
│   ├── service/                  # 비즈니스 로직 레이어
│   │     ├── category_service.rs   # Category 비즈니스 로직
│   │     ├── todo_service.rs       # Todo 비즈니스 로직
│   │     └── reset_service.rs      # 리셋 로직
│   └── commands/                 # Tauri 커맨드 핸들러
│         ├── category_commands.rs  # Category 커맨드
│         ├── todo_commands.rs      # Todo 커맨드
│         └── settings_commands.rs  # Settings 커맨드
└── tauri.conf.json               # Tauri 설정
```

[^1]: `+page.svelte`, `+layout.css`, `+layout.svelte`로 구성되어 있다.