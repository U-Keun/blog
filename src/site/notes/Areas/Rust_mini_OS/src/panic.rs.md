---
{"tags":["Code","OS","Rust"],"sticker":"lucide//code-2","dg-publish":true,"permalink":"/areas/rust-mini-os/src/panic-rs/","dgPassFrontmatter":true}
---

커널 레벨에서 패닉을 처리하는 모듈을 살펴보자.

```rust
#[panic_handler]
fn panic(info: &core::panic::PanicInfo) -> ! {
    if let Some(loc) = info.location() {
        let msg = info.message();
        crate::kprintln!("PANIC: {}:{}: {}", loc.file(), loc.line(), msg);
    } else {
        crate::kprintln!("PANIC: <unknown location>");
    }
    halt()
}
```
먼저 `#[panic_handler]` 함수[^1]로 Rust 런타임 패닉을 처리한다. 패닉이 발생한 위치, 메시지 등의 메타 정보를 담고 있는 `info`로 커널 콘솔에 내용을 출력하고, `halt()` 함수로 CPU를 멈춘다. Rust 코드 어디선가 `panic!()`이 일어나면 이 함수가 호출된다. 

참고로, 이 함수는 반환 타입 부분이 `-> !`로 되어 있는데, 이것은 정상적으로 리턴하지 않는다는 의미이다. 즉, 이 함수는 반드시 루프를 돌거나, 전원이 꺼지거나, CPU `halt` 등으로 끝나야 한다는 것이다. 

```rust
#[macro_export]
macro_rules! PANIC {
    ($fmt:literal $(, $arg:expr)*) => {{
        $crate::kprintln!("PANIC: {}:{}: {}",
            core::file!(), core::line!(), core::format_args!($fmt $(, $arg)*));
        $crate::runtime::halt()
    }};
    () => {{
        $crate::kprintln!("PANIC: {}:{}", core::file!(), core::line!());
        $crate::runtime::halt()
    }};
}
```
커널 코드에서 명시적으로 중단시키고 싶을 때 사용하는 매크로이다. `#[macro_export]`로 공개했기 때문에, 이 크레이트를 사용하는 다른 크레이트에서도 `crate_name::PANIC!` 형태로 매크로를 호출할 수 있다.

`core::file!()`, `core::line!()`, `core::format_args!()` 매크로는 각각 현재 소스 파일 경로와 라인 번호, 포맷 인자를 다루는 컴파일러 내장 매크로이다. 마지막으로는 `halt()` 함수로 CPU를 멈추는데, 매크로가 어떤 크레이트, 모듈에서 호출되더라도 항상 이 크레이트의 `runtime::halt`를 가리키도록 `$crate::runtime::halt()`로 절대 경로를 지정해주었다.

```rust
use crate::runtime::halt;
```
`halt()` 함수는 `crate::runtime`에 있는 것을 가져온다. 파일 상단에 위와 같이 선언되어 있다.

>[!Note] `halt()` 함수는 [[Areas/Rust_mini_OS/src/runtime.rs\|runtime.rs]] 에 정의되어 있다.

[^1]: `#![no_std]` 환경에서 반드시 직접 구현해야 하는 패닉 처리 진입점이다.