---
{"tags":["Code","OS","Rust"],"sticker":"lucide//code-2","dg-publish":true,"permalink":"/projects/rust-mini-os/console-rs/","dgPassFrontmatter":true}
---

SBI의 `sbi_putchar`를 감싼 커널용 출력 모듈이다. 간단한 스핀락과 `core::fmt::Write`, 그리고 매크로(`kprint!`, `kprintln!`)가 구현되어 있다.

```rust
struct Spin(AtomicBool);

impl Spin {
    const fn new() -> Self { Self(AtomicBool::new(false)) }

    fn lock(&self) {
        while self.0.swap(true, Ordering::Acquire) {}
    }

    fn unlock(&self) { self.0.store(false, Ordering::Release); }
}

static LOCK: Spin = Spin::new();
```
간단하게 구현되어 있는 스핀락 구조체이다. 내부에 `AtomicBool` 하나만 들고 있고, `false`면 잠금이 풀린 상태이고, `true`이면 누군가 잡고 있는 상태이다.

`lock()` 함수에서 사용하는 `AtomicBool::swap(..., Acquire)`는 새 값을 저장하기 전에 메모리에 들어 있던 이전 값을 반환한다. 여기서 `Acquire`는, 같은 코드 흐름 내에서, 이 연산 이후에 실행되는 모든 읽기/쓰기가 이 연산보다 앞쪽으로 재배치되지 않도록 막는다. 

`unlock()` 함수에서 사용하는 `AtomicBool::store(..., Release)`는 락을 나타내는 값을  `false`로 저장한다. `Release`는 같은 코드 흐름 내에서 이 연산 이전에 수행된 모든 쓰기가 이 연산보다 뒤로 재배치되지 않도록 하고, 이 저장 연산을 `Acquire` 연산으로 관찰하는 다른 코드 흐름에서 그 쓰기들이 모두 보이도록 보장한다. 이 `Acquire`/`Release` 쌍으로 스핀락으로 보호되는 구간의 메모리 일관성이 유지된다.

요약하면, 이 스핀락은 단순히 동시에 한 코드 흐름만 크리티컬 섹션에 들어오게 하면서, 락으로 감싼 구간 안에서 공유 데이터의 메모리 일관상까지 보장한다.

그리고 전역 스핀락 인스턴스(`LOCK`)를 두어, 콘솔 출력이 이 락을 통해 직렬화되도록 만들었다. 다음 코드는 이 락이 사용된, C 스타일 문자/문자열 출력 함수들이다.
```rust
#[inline]
pub fn putchar(b: u8) {
    LOCK.lock();
    sbi_putchar(b);
    LOCK.unlock();
}

#[inline]
pub fn puts(s: &str) {
    LOCK.lock();
    for &ch in s.as_bytes() {
		sbi_putchar(ch);
    }
    LOCK.unlock();
}
```
`putchar`는 단일 바이트를 `sbi_putchar`로 보내기 전에 락을 잡았다가, 출력이 끝나면 곧바로 락을 푼다. `puts`는 문자열 전체를 하나의 크리티컬 섹션으로 묶어서, 문자열 중간에 다른 코드 흐름이 끼어들어 출력 내용을 섞어놓지 못하게 한다.

```rust
pub struct Console;

impl Write for Console {
    fn write_str(&mut self, s: &str) -> fmt::Result {
        puts(s);
        Ok(())
    }
}
```
필드가 없는, 타입 태그용 `Console` 구조체이다. `core::fmt::Write`를 구현해서 `write!(Console, "hello {}", 42)` 같은 호출이 가능하도록 만들었다. `write!` 매크로가 사용되면, `write_str()` 함수가 호출된다. 

```rust
#[macro_export]
macro_rules! kprint {
    ($($arg:tt)*) => {{
        use core::fmt::Write;
        let _ = write!($crate::console::Console, $($arg)*);
    }};
}

#[macro_export]
macro_rules! kprintln {
    () => { $crate::kprint!("\n") };
    ($($arg:tt)*) => {{
        $crate::kprint!("{}\n", format_args!($($arg)*));
    }};
}
```
그리고 커널 전용 출력 매크로로 `kprint`, `kprintln` 을 위와 같이 구현해 두었다.

> 이 스핀락은 같은 코드 흐름에서 재진입을 허용하지 않는다. 예를 들어, 이미 락을 잡은 상태에서 인터럽트 핸들러 또는 다른 경로가 다시 `kprint!`를 호출하면 데드락이 발생할 수 있으므로, 추후 인터럽트 마스킹 또는 CPU 별 콘솔 버퍼와 함께 사용하는 등의 보완이 필요하다.

`use` 구문은 다음과 같다.
```rust
use core::fmt::{ self, Write };
use core::sync::atomic::{ AtomicBool, Ordering };
use crate::sbi::sbi_putchar;
```

>[!Note]
`sbi_putchar`를 포함한 SBI 호출 래퍼는 [[Projects/Rust_mini_OS/sbi.rs\|sbi.rs]] 에 정의되어 있다.